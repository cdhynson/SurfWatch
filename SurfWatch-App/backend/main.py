# Standard Library
import json
import os
import uuid
import traceback
from datetime import datetime
from contextlib import asynccontextmanager

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

# FastAPI Components
from fastapi import (
    FastAPI, Request, Query, Form, Body, Depends, Security,
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
def video_feed():
    return StreamingResponse(gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')

    
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

# ---------------------
# Profile Endpoints
# ---------------------

class SessionsModel(BaseModel):
    title: str
    location: str
    rating: int
    start: str
    end: str

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


@app.get("/api/profile/session")
def get_sessions(current_user: dict = Depends(get_current_user)):
    query = (
        "SELECT id, title, location, start, end, rating "
        "FROM user_surf_sessions WHERE user_id = %s"
    )
    params = [current_user["email"]]

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute(query, params)
        results = cursor.fetchall()
        cursor.close()
        db.close()

        # Convert datetime objects to ISO strings
        for record in results:
            if isinstance(record.get("start"), datetime):
                record["start"] = record["start"].isoformat()
            if isinstance(record.get("end"), datetime):
                record["end"] = record["end"].isoformat()

        return results
    except Error as e:
        print("Database error:", str(e))
        raise HTTPException(status_code=500, detail="Database query error")


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
        "INSERT INTO user_surf_sessions (title, location, ratings, user_id) VALUES (%s, %s, %s, %s)",
        (request.title, request.location, request.rating, user["id"]),
    )
    db.commit()
    id = cursor.lastrowid
    db.close()

    return {"id": id, "title": request.title, "rating": request.rating}



# ------------------------
# Weather API Endpoints
# ------------------------


class WeatherRequest(BaseModel):
    lat: float
    lon: float
    start_hour: str  # Format: "2025-05-22T00:00"
    end_hour: str    # Format: "2025-05-23T00:00"


@app.post("/api/weather")
def get_weather(
    weather_req: WeatherRequest,
):
    try:
        cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
        openmeteo = openmeteo_requests.Client(session=cache_session)

        url = "https://marine-api.open-meteo.com/v1/marine"
        params = {
            "latitude": weather_req.lat,
            "longitude": weather_req.lon,
            "hourly": ["wave_height", "wind_wave_height", "sea_surface_temperature"],
            "start_hour": weather_req.start_hour,
            "end_hour": weather_req.end_hour
        }
        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]  # one location = one response

        hourly = response.Hourly()

        # Extract numpy arrays for each variable
        hourly_wave_height = hourly.Variables(0).ValuesAsNumpy()
        hourly_wind_wave_height = hourly.Variables(1).ValuesAsNumpy()
        hourly_sea_surface_temperature = hourly.Variables(2).ValuesAsNumpy()

        # Build a dictionary with just the arrays
        hourly_data = {
            "wave_height": hourly_wave_height,
            "wind_wave_height": hourly_wind_wave_height,
            "sea_surface_temperature": hourly_sea_surface_temperature
        }

        # Create DataFrame for easy averaging
        hourly_df = pd.DataFrame(data=hourly_data)

        # Compute column-wise means
        averages = hourly_df.mean(skipna=True).to_dict()

        # Convert numpy types to native Python floats (for JSON serialization)
        result = {key: float(val) for key, val in averages.items()}

        return {"averages": result}

    except Exception as e:
        print("Weather API Error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Weather API error: {str(e)}")
