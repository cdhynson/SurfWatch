# Standard Library
import json
import os
import uuid
import traceback
from datetime import datetime, time, timedelta, timezone
from contextlib import asynccontextmanager
from typing import List

# Third-Party Libraries
import cv2
import mysql.connector as mysql
import pandas as pd
import requests_cache
import openmeteo_requests
import uvicorn
from dotenv import load_dotenv
from mysql.connector import Error
from pydantic import BaseModel
from retry_requests import retry
from passlib.hash import bcrypt
from jose import jwt, JWTError
from .crowd import (
    generate_hourly_crowd_forecast, summarize_daily_crowdedness, get_environmental_summary)

# from crowd import crowd_forecast

# FastAPI Components
from fastapi import (
    FastAPI, Request, Query, Form, Body, Depends, Security, Path,
    status, HTTPException
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    StreamingResponse, JSONResponse,
    HTMLResponse, RedirectResponse
)
from fastapi.templating import Jinja2Templates
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# enable CORS in FastAPI app to allow requests from  React frontend
async def lifespan(app: FastAPI):
    try:
        setup_database()
        print("Database setup complete.")
        yield
    finally:
        print("Shutdown completed.")

# JWT
SECRET_KEY = "supersecretkey" #Replace later
security = HTTPBearer()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


 
# load env -G
load_dotenv('../.env', override=True)

# get database connection info from .env -G
dev_mode = os.environ.get('DEV_MODE', 'False').lower() == 'true'
db_host = os.environ['MYSQL_HOST']
db_user = os.environ['MYSQL_USER']
db_pass = os.environ['MYSQL_PASSWORD']
db_name = os.environ['MYSQL_DATABASE']
db_port = os.environ['MYSQL_PORT']


# import the database functions -G
from app.database import (
    get_db_connection,
    setup_database,
    get_user_by_email,
    get_user_by_id,
    create_session,
    get_session,
    delete_session,
)

camera = cv2.VideoCapture(0)
templates = Jinja2Templates(directory="app")
def gen_frames():
    while True:
        success, frame = camera.read()
        
        if not success:
            break
        else:
            cv2.normalize(frame, frame, 50, 255, cv2.NORM_MINMAX)
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.get('/api/camera')
def index(request: Request):
    return templates.TemplateResponse("camera.html", {"request": request})

@app.get('/video_feed')
def video_feed(request: Request):
    return templates.TemplateResponse("camera.html", {"request": request})
    #return StreamingResponse(gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')

    
# ---------------------
# User Auth. Endpoints 
# ---------------------

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
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload            
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# post signup credentials to sql database -G
@app.post('/signup')
def signup(request: SignUp):
    print("Received signup request:", request.dict())
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users where email = %s", (request.email,))
    if cursor.fetchone():
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    cursor.execute("SELECT * FROM users where username = %s", (request.username,))
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
    
    token_data = {
        "email": request.email,
        "username": request.username,
        "location": request.location
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")

    return {"msg": "User created", "token": token}

# query the database for the user to log in -G
@app.post("/login")
def login(request: Login):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (request.email,))
    db_user = cursor.fetchone()
    db.close()

    if not db_user or not bcrypt.verify(request.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {
        "email": db_user["email"],
        "username": db_user["username"],
        "location": db_user["location"]
        }
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")

    return {"token": token}

@app.get("/api/user")
def get_me(current_user: dict = Depends(get_current_user)):
    current_email = current_user["email"]
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT username, email, location FROM users WHERE email = %s", (current_email,))
    row = cursor.fetchone()
    cursor.close()
    db.close()
    if not row:
        raise HTTPException(status_code=404, detail=("User not found: %s", (current_email,)))
    return {
    "username": row["username"],
    "email": row["email"],
    "location": row["location"],
    }

# ---------------------
# Profile Endpoints
# ---------------------

class SessionsModel(BaseModel):
    title: str
    location: str
    start: datetime
    end: datetime
    rating: int

class SessionOut(BaseModel):
    id: int
    title: str
    location: str
    start: datetime
    end: datetime
    rating: int

    class Config:
        orm_mode = True


@app.get("/api/profile/session", response_model=List[SessionOut])
def get_sessions(current_user: dict = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # Get user ID based on email
    cursor.execute("SELECT id FROM users WHERE email = %s", (current_user["email"],))
    user = cursor.fetchone()
    if not user:
        cursor.close()
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch sessions using user ID
    cursor.execute("""
        SELECT id, title, location, start, end, rating 
        FROM user_surf_sessions 
        WHERE user_id = %s
    """, (user["id"],))
    
    results = cursor.fetchall()
    cursor.close()
    db.close()

    return results


@app.post("/api/profile/session")
def add_session(
    request: SessionsModel,
    current_user: dict = Depends(get_current_user)
):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (current_user["email"],))
    user = cursor.fetchone()
    if not user:
        db.close()
        raise HTTPException(status_code=401, detail="User not found")
    
    cursor.execute(
    "INSERT INTO user_surf_sessions (title, location, start, end, rating, user_id) VALUES (%s, %s, %s, %s, %s, %s)",
    (request.title, request.location, request.start, request.end, request.rating, user["id"]),
    )
    db.commit()
    id = cursor.lastrowid
    db.close()

    return {"id": id, "title": request.title, "rating": request.rating, "location": request.location, "start": request.start, "end": request.end}


@app.patch("/api/profile/session/{session_id}")
def update_session(
    session_id: int = Path(..., description="ID of the session to update"),
    request: SessionsModel = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # Get user ID
    cursor.execute("SELECT id FROM users WHERE email = %s", (current_user["email"],))
    user = cursor.fetchone()
    if not user:
        cursor.close()
        db.close()
        raise HTTPException(status_code=401, detail="User not found")

    # Ensure session belongs to user
    cursor.execute(
        "SELECT * FROM user_surf_sessions WHERE id = %s AND user_id = %s",
        (session_id, user["id"])
    )
    session = cursor.fetchone()
    if not session:
        cursor.close()
        db.close()
        raise HTTPException(status_code=404, detail="Session not found")

    # Build update query dynamically
    fields = []
    values = []

    for field in ['title', 'location', 'rating', 'start', 'end']:
        val = getattr(request, field)
        if val is not None:
            fields.append(f"{field} = %s")
            values.append(val)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    query = f"UPDATE user_surf_sessions SET {', '.join(fields)} WHERE id = %s AND user_id = %s"
    values.extend([session_id, user["id"]])

    cursor.execute(query, values)
    db.commit()
    cursor.close()
    db.close()

    return {"message": "Session updated successfully"}


# ------------------------
# Crowd API Endpoints
# ------------------------

@app.get("/api/crowd/hourly")
def get_hourly_crowd(beach_index: int, start_date: str, end_date: str):
    try:
        df = generate_hourly_crowd_forecast(beach_index, start_date, end_date)

        # Format data for frontend
        result = [
            {
                "date": pd.to_datetime(row["timestamp"]).strftime("%Y-%m-%d"),
                "time": pd.to_datetime(row["timestamp"]).strftime("%-I%p").lower(),
                "value": round(row["crowdedness"], 0)
            }
            for _, row in df.iterrows()
        ]


        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
        
@app.get("/api/crowd/daily")
def get_daily_crowdedness_summary(beach_index: int, start_date: str, end_date: str):
    try:
        df = generate_hourly_crowd_forecast(beach_index, start_date, end_date)
        summary = summarize_daily_crowdedness(df)
        return JSONResponse(content=summary)

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
    
# ------------------------
# Environmental conditions API Endpoints
# ------------------------
    
@app.get("/api/environmental-summary")
def environmental_summary_route(
    beach_id: int = Query(..., description="Beach ID")
):
    """
    API route that returns the environmental summary for a given beach ID.
    Uses today's date with a fixed time range: 5:00 AM to 8:00 PM PST.
    """
    # PST = UTC-7
    PST = timezone(timedelta(hours=-7))
    now = datetime.now(PST)
    
    # Build datetime range for today
    start_dt = datetime.combine(now.date(), time(hour=5), tzinfo=PST)
    end_dt = datetime.combine(now.date(), time(hour=20), tzinfo=PST)

    summary = get_environmental_summary(beach_id, start_dt.isoformat(), end_dt.isoformat())
    return JSONResponse(content=summary)

@app.get("/api/environmental-conditions")
def environmental_conditions_route(
    beach_id: int = Query(..., description="Beach ID"),
    start: str = Query(..., description="Start datetime in ISO format (e.g., 2025-06-09T05:00:00-07:00)"),
    end: str = Query(..., description="End datetime in ISO format (e.g., 2025-06-09T20:00:00-07:00)")
):
    """
    Returns wave height, wind speed/direction, tide, and temperature for a beach between start and end datetime.
    """
    try:
        # Call the existing summary function with start and end
        summary = get_environmental_summary(beach_id, start, end)

        # Return only the desired subset
        selected_data = {
            "temperature_2m": summary["temperature_2m"],
            "wind_speed": summary["wind_speed"],
            "wind_direction": summary["wind_direction"],
            "wave_height": summary["wave_height"],
            "tide": summary["tide"]
        }
        return JSONResponse(content=selected_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Environmental conditions api error: {str(e)}")