# === Standard Library ===
import json
import os
import traceback
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, time, timedelta, timezone
from typing import List

# === Third-Party Libraries ===
import cv2
import mysql.connector as mysql
import openmeteo_requests
import pandas as pd
import requests_cache
import uvicorn
from dotenv import load_dotenv
from jose import JWTError, jwt
from mysql.connector import Error
from passlib.hash import bcrypt
from pydantic import BaseModel
from retry_requests import retry

# === FastAPI Components ===
from fastapi import (
    Body, Depends, FastAPI, Form, HTTPException, Path, Query, Request,
    Security, status
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    HTMLResponse, JSONResponse, RedirectResponse, StreamingResponse
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.templating import Jinja2Templates

# === Local Modules ===
from .crowd import (
    generate_hourly_crowd_forecast,
    get_environmental_summary,
    summarize_daily_crowdedness
)
from app.database import (
    create_session,
    delete_session,
    get_db_connection,
    get_session,
    get_user_by_email,
    get_user_by_id,
    setup_database
)

# === Application Setup ===

SECRET_KEY = os.environ["SECRET_KEY"]
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable not set")

security = HTTPBearer()
load_dotenv('../.env', override=True)

dev_mode = os.environ.get('DEV_MODE', 'False').lower() == 'true'
db_host = os.environ['MYSQL_HOST']
db_user = os.environ['MYSQL_USER']
db_pass = os.environ['MYSQL_PASSWORD']
db_name = os.environ['MYSQL_DATABASE']
db_port = os.environ['MYSQL_PORT']

app = FastAPI(lifespan=lambda app: setup_and_teardown(app))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

templates = Jinja2Templates(directory="app")
camera = cv2.VideoCapture(0)


# === Lifespan ===

@asynccontextmanager
async def setup_and_teardown(app: FastAPI):
    try:
        setup_database()
        print("Database setup complete.")
        yield
    finally:
        print("Shutdown completed.")


# === Camera Feed Routes ===

def gen_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        cv2.normalize(frame, frame, 50, 255, cv2.NORM_MINMAX)
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n'


@app.get('/api/camera')
@app.get('/video_feed')
def show_camera(request: Request):
    return templates.TemplateResponse("camera.html", {"request": request})
    # To stream video feed uncomment below:
    # return StreamingResponse(gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')


# === Auth Models & Logic ===

class SignUp(BaseModel):
    username: str
    email: str
    password: str
    location: str

class Login(BaseModel):
    email: str
    password: str

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        return jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post('/signup')
def signup(request: SignUp):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (request.email,))
    if cursor.fetchone():
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    cursor.execute("SELECT * FROM users WHERE username = %s", (request.username,))
    if cursor.fetchone():
        db.close()
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = bcrypt.hash(request.password)
    cursor.execute(
        "INSERT INTO users (username, email, password, location) VALUES (%s, %s, %s, %s)",
        (request.username, request.email, hashed_password, request.location),
    )
    db.commit()
    db.close()

    token = jwt.encode({
        "email": request.email,
        "username": request.username,
        "location": request.location
    }, SECRET_KEY, algorithm="HS256")

    return {"msg": "User created", "token": token}


@app.post("/login")
def login(request: Login):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (request.email,))
    db_user = cursor.fetchone()
    db.close()

    if not db_user or not bcrypt.verify(request.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({
        "email": db_user["email"],
        "username": db_user["username"],
        "location": db_user["location"]
    }, SECRET_KEY, algorithm="HS256")

    return {"token": token}


@app.get("/api/user")
def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT username, email, location FROM users WHERE email = %s", (current_user["email"],))
    row = cursor.fetchone()
    cursor.close()
    db.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


# === Session Models & Routes ===

class SessionsModel(BaseModel):
    title: str
    location: str
    start: datetime
    end: datetime
    rating: int

class SessionOut(SessionsModel):
    id: int
    class Config:
        orm_mode = True


@app.get("/api/profile/session", response_model=List[SessionOut])
def get_sessions(current_user: dict = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (current_user["email"],))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    cursor.execute("""
        SELECT id, title, location, start, end, rating 
        FROM user_surf_sessions 
        WHERE user_id = %s
    """, (user["id"],))
    sessions = cursor.fetchall()
    cursor.close()
    db.close()
    return sessions


@app.post("/api/profile/session")
def add_session(request: SessionsModel, current_user: dict = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (current_user["email"],))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    cursor.execute(
        "INSERT INTO user_surf_sessions (title, location, start, end, rating, user_id) VALUES (%s, %s, %s, %s, %s, %s)",
        (request.title, request.location, request.start, request.end, request.rating, user["id"])
    )
    db.commit()
    new_id = cursor.lastrowid
    cursor.close()
    db.close()
    return {**request.dict(), "id": new_id}


@app.patch("/api/profile/session/{session_id}")
def update_session(
    session_id: int,
    request: SessionsModel,
    current_user: dict = Depends(get_current_user)
):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (current_user["email"],))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    cursor.execute(
        "SELECT * FROM user_surf_sessions WHERE id = %s AND user_id = %s",
        (session_id, user["id"])
    )
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Session not found")

    updates = {k: getattr(request, k) for k in ['title', 'location', 'rating', 'start', 'end'] if getattr(request, k) is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    fields = ", ".join([f"{k} = %s" for k in updates])
    values = list(updates.values()) + [session_id, user["id"]]

    cursor.execute(f"UPDATE user_surf_sessions SET {fields} WHERE id = %s AND user_id = %s", values)
    db.commit()
    cursor.close()
    db.close()
    return {"message": "Session updated successfully"}


# === Crowd Forecast Routes ===

@app.get("/api/crowd/hourly")
def get_hourly_crowd(beach_index: int, start_date: str, end_date: str):
    try:
        df = generate_hourly_crowd_forecast(beach_index, start_date, end_date)
        return JSONResponse(content=[
            {
                "date": pd.to_datetime(row["timestamp"]).strftime("%Y-%m-%d"),
                "time": pd.to_datetime(row["timestamp"]).strftime("%-I%p").lower(),
                "value": round(row["crowdedness"])
            }
            for _, row in df.iterrows()
        ])
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/crowd/daily")
def get_daily_crowdedness_summary(beach_index: int, start_date: str, end_date: str):
    try:
        df = generate_hourly_crowd_forecast(beach_index, start_date, end_date)
        return JSONResponse(content=summarize_daily_crowdedness(df))
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# === Environmental API Routes ===

@app.get("/api/environmental-summary")
def environmental_summary_route(beach_id: int = Query(...)):
    PST = timezone(timedelta(hours=-7))
    now = datetime.now(PST)
    start = datetime.combine(now.date(), time(5), tzinfo=PST)
    end = datetime.combine(now.date(), time(20), tzinfo=PST)
    summary = get_environmental_summary(beach_id, start.isoformat(), end.isoformat())
    return JSONResponse(content=summary)


@app.get("/api/environmental-conditions")
def environmental_conditions_route(
    beach_id: int = Query(...),
    start: str = Query(...),
    end: str = Query(...)
):
    try:
        summary = get_environmental_summary(beach_id, start, end)
        return JSONResponse(content={
            k: summary[k] for k in ["temperature_2m", "wind_speed", "wind_direction", "wave_height", "tide"]
        })
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Environmental conditions API error: {str(e)}")
