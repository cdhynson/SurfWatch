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

load_dotenv('../.env', override=True)

dev_mode = os.environ.get('DEV_MODE', 'False').lower() == 'true'
db_host = os.environ['MYSQL_HOST']
db_user = os.environ['MYSQL_USER']
db_pass = os.environ['MYSQL_PASSWORD']
db_name = os.environ['MYSQL_DATABASE']
db_port = os.environ['MYSQL_PORT']

# import the database functions
from app.database import (
    setup_database,
    get_user_by_email,
    get_user_by_id,
    create_session,
    get_session,
    delete_session,
)

# setup the database on startup
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

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
