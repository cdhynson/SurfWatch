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

# FastAPI Components
from fastapi import (
    FastAPI, Request, Query, Form, Body, Depends,
    status, HTTPException
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    StreamingResponse, JSONResponse,
    HTMLResponse, RedirectResponse
)
from fastapi.templating import Jinja2Templates



# enable CORS in FastAPI app to allow requests from  React frontend
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await setup_database()
        print("Database setup complete.")
        yield
    finally:
        print("Shutdown completed.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
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

@app.get('/')
def index(request: Request):
    return templates.TemplateResponse("camera.html", {"request": request})

@app.get('/video_feed')
def video_feed():
    return StreamingResponse(gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')


# static file helpers
# used for redirect responses, look at line 123 for example -G
def read_html(file_path: str) -> str:
    with open(file_path, "r") as f:
        return f.read()
    
# ---------------------
# User Auth. Endpoints 
# ---------------------

async def get_current_user(request: Request):
    session_id = request.cookies.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=401, detail="No session cookie.")
    
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session.")

    user = await get_user_by_email(session["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return user

# signup page -G
@app.get('/signup')
def signup(request: Request):
    with open('app/signup.html') as html:
        return HTMLResponse(html.read())

# post signup credentials to sql database -G
@app.post('/signup')
async def post_signup(request: Request):
    form_data = await request.form()
    username = form_data.get("username")
    email = form_data.get("email")
    password = form_data.get("password")
    location = form_data.get("location")

    existing_user = await get_user_by_email(email)
    if existing_user: 
        raise HTTPException(status_code=400, detail="User already exists.")

    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO users (username, email, password, location) VALUES (%s, %s, %s, %s)",
        (username, email, password, location),
    )
    db.commit()
    db.close()

    new_session_id = str(uuid.uuid4())
    await create_session(email, new_session_id)

    response = JSONResponse(content={"message": "Signup successful."})
    response.set_cookie(key="sessionId", value=new_session_id, httponly=True)
    return response

# error page if user exists already, idk i used this in my final project for 140a -G
def get_error_html(email: str) -> str:
    error_html = read_html("app/error.html")
    return error_html.replace("{email}", email)

# get the login page with session ids and cookies -G
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Show login if not logged in, or redirect to profile page"""
    # TODO: 3. check if sessionId is in attached cookies and validate it
    # if all valid, redirect to /user/{username}
    # if not, show login page
    session_id = request.cookies.get("sessionId")
    if session_id: 
        session = await get_session(session_id)
        if session:
            return RedirectResponse(url=f"/user/{session['email']}", status_code=status.HTTP_302_FOUND)
    return HTMLResponse(read_html("app/login.html"))

# query the database for the user to log in -G
@app.post("/login")
async def login(request: Request):
    form_data = await request.form()
    email = form_data.get("email")
    password = form_data.get("password")

    user = await get_user_by_email(email)
    if user is None or user["password"] != password:
        raise HTTPException(status_code=400, detail="Invalid credentials.")

    new_session_id = str(uuid.uuid4())
    await create_session(user["email"], new_session_id)

    response = JSONResponse(content={"message": "Login successful."})
    response.set_cookie(key="sessionId", value=new_session_id, httponly=True)
    return response

# ---------------------
# Profile Endpoints
# ---------------------

class SessionsRequest(BaseModel):
    title: str
    location: str
    rating: int
    start: str
    end: str


@app.get("/api/profile/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    query = (
        "SELECT id, title, location, start, end, rating "
        "FROM user_surf_sessions WHERE user_id = %s"
    )
    params = [current_user["id"]]

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params)
        results = cursor.fetchall()
        cursor.close()
        connection.close()

        # Convert datetime objects to ISO strings
        for record in results:
            if isinstance(record.get("start"), datetime):
                record["start"] = record["start"].isoformat()
            if isinstance(record.get("end"), datetime):
                record["end"] = record["end"].isoformat()

        return {"sessions": results}
    except Error as e:
        print("Database error:", str(e))
        raise HTTPException(status_code=500, detail="Database query error")


@app.post("/api/profile/session")
async def post_session(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    form_data = await request.form()
    title = form_data.get("title")
    location = form_data.get("location")
    rating = form_data.get("rating")
    print(f"Received form data: title={title}, location={location}, rating={rating}")

    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO user_surf_sessions (title, location, ratings, user_id) VALUES (%s, %s, %s, %s)",
        (title, location, rating, current_user["id"]),
    )
    db.commit()
    db.close()

    return RedirectResponse(url="/profile", status_code=status.HTTP_302_FOUND)


# ------------------------
# Weather API Endpoints
# ------------------------


class WeatherRequest(BaseModel):
    lat: float
    lon: float
    start_hour: str  # Format: "2025-05-22T00:00"
    end_hour: str    # Format: "2025-05-23T00:00"


@app.post("/api/weather")
async def get_weather(
    weather_req: WeatherRequest,
    current_user: dict = Depends(get_current_user)
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
