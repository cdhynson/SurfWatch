import cv2
import uvicorn
from fastapi import FastAPI, Request, Query, Form, Body, status
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse, RedirectResponse
import mysql.connector as mysql
from dotenv import load_dotenv
import json
import requests
import os
from contextlib import asynccontextmanager
import uuid

# enable CORS in FastAPI app to allow requests from  React frontend
from fastapi.middleware.cors import CORSMiddleware

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

# setup the database on startup -G
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await setup_database()
        print("Database setup complete.")
        yield
    finally:
        print("Shutdown completed.")


app = FastAPI(lifespan=lifespan)
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
    print(f"Received form data: username={username}, email={email}, password={password}, location={location}")

    existing_user = await get_user_by_email(email)
    if existing_user: 
        return HTMLResponse(get_error_html(email), status_code=status.HTTP_400_BAD_REQUEST)

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
    
    response = RedirectResponse(url=f"/user/{email}", status_code=status.HTTP_302_FOUND)
    response.set_cookie(key="sessionId", value=new_session_id)
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
    """Validate credentials and create a new session if valid"""
    # TODO: 4. Get username and password from form data
    form_data = await request.form()
    email = form_data.get("email")
    username = form_data.get("username")
    password = form_data.get("password")

    # TODO: 5. Check if username exists and password matches
    user = await get_user_by_email(email)
    if user is None or user["password"] != password:
        return HTMLResponse(get_error_html(email))

    # TODO: 6. Create a new session
    new_session_id = str(uuid.uuid4())
    await create_session(user["email"], new_session_id)

    # TODO: 7. Create response with:
    #   - redirect to /user/{username}
    #   - set cookie with session ID
    #   - return the response
    response = RedirectResponse(url=f"/user/{email}", status_code=status.HTTP_302_FOUND)
    response.set_cookie(key="sessionId", value=new_session_id)
    return response

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
