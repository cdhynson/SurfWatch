# SurfWatch

SurfWatch is a full-stack web application for lineup crowd detection/forecasting, surf session tracking, live beach cams, and surf/environmental forecasting.

---

## Project Structure

```
SurfWatch/
├── SurfWatch-App/
│   ├── backend/
│   │   ├── main.py                # FastAPI application entrypoint and API route definitions
│   │   ├── camera.html            # Camera stream HTML
│   │   ├── crowd.py               # Crowd forecasting logic
│   │   ├── database.py            # Database connection and helpers
│   │   ├── models/                # Crowd forecasting model and features
│   │   ├── requirements.txt       # Python dependencies
│   │   └── Dockerfile             # Backend Dockerfile
│   └── frontend/
│       ├── public/                # Static assets (index.html, icons, etc.)
│       ├── src/
│       │   ├── components/        # Reusable React components
│       │   │   ├── Forecast/      # Forecast-related components (charts, sheets)
│       │   │   ├── Navbars/       # Navigation components (TopNav, BottomNav)
│       │   │   ├── Sessions/      # Session-related components (SessionCard, modal)
│       │   │   └── Home/          # Home page components (BeachCam)
│       │   ├── pages/             # Top-level React pages (Profile, Explore, Home, Settings, Login/Signup)
│       │   ├── App.js             # Main React app entrypoint
│       │   ├── index.js           # ReactDOM render entrypoint
│       │   └── utils.js           # Shared utility functions
│       ├── package.json           # Frontend dependencies and scripts
│       └── Dockerfile             # Frontend Dockerfile
├── Crowd Forecast/                # Jupyter notebooks, data, and models for crowd forecasting
│   ├── APIs+Data/                 # Data and API notebooks for crowd model
│   ├── models/                    # Trained crowd forecast models
│   ├── requirements.txt           # Python dependencies for crowd forecast
│   └── test_model.ipynb           # Crowd model test notebook
├── Crowd Detection/               # YOLO and other detection scripts/models
│   ├── Data/                      # Data and scripts for detection
│   ├── final.pt                   # YOLO trained weights
│   ├── showcase.py                # Showcase script for detection
│   ├── requirements.txt           # Python dependencies for detection
│   └── test_model.ipynb           # Detection model test notebook
└── README.md                      # Project root README
```

---

## Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- (Optional for development) Python 3.9+, Node.js 18+, MySQL

---

## Local Deployment with Docker

1. **Clone the repository:**

   ```sh
   git clone <your-repo-url>
   cd SurfWatch
   ```

2. **Configure environment variables:**

   - Copy the example environment file and edit as needed:
     ```sh
     cp .env.example .env
     ```
   - Edit `.env` with your secrets and database info.

3. **Build and run the containers:**

   ```sh
   docker-compose up --build
   ```

   This will start:
   - The FastAPI backend (on port 8000)
   - The React frontend (on port 3000)
   - The MySQL database (on port 3306)

4. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)

---

## Usage
#### Note: Interface was designed in mind for mobile use.

- **Login/Signup:** Create an account or log in.
- **Profile:** Track your surf sessions, view stats, and add new sessions.
- **Explore:** View live beach cams and environmental conditions.
- **Forecast:** See crowd and environmental forecasts for supported beaches.

---

## Development (Optional)

You can run the frontend and backend separately for development:

### Backend

```sh
cd SurfWatch-App/backend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```sh
cd SurfWatch-App/frontend
npm install
npm start
```

---

# Backend Technical Overview

This document describes the backend architecture, main modules, API endpoints, and data flow for the SurfWatch application.

---

## 1. Overview

- **Framework:** FastAPI (Python)
- **Database:** MySQL
- **ML/Forecasting:** XGBoost, Open-Meteo API, custom crowd models
- **Deployment:** Docker (with Docker Compose)
- **Directory:** `SurfWatch-App/backend/`

---

## 2. Key Modules

### main.py

- **Entrypoint for FastAPI app**
- Handles:
  - User authentication (signup, login, JWT)
  - User profile and surf session CRUD
  - Camera/video feed endpoints
  - Environmental and crowd forecast API endpoints
  - CORS and middleware setup
  - Database setup and teardown

### database.py

- **Database connection and schema management**
- Functions for:
  - Connecting to MySQL using environment variables
  - Creating and dropping tables (`users`, `sessions`, `user_surf_sessions`)
  - Utility functions for user/session CRUD

### crowd.py

- **Crowd forecasting and environmental data logic**
- Contains:
  - Integration with Open-Meteo API for weather/marine data
  - XGBoost-based crowd density prediction
  - Data aggregation for hourly/daily crowd forecasts
  - Functions to summarize and merge environmental data

---

## 3. Database Schema

### Tables

- **users**
| Field         | Type      | Description                |
|---------------|-----------|----------------------------|
| id            | INT (PK)  | Unique user ID             |
| username      | VARCHAR   | Unique username            |
| email         | VARCHAR   | Unique email               |
| password      | TEXT      | Hashed password            |
| location      | VARCHAR   | User's home location       |
| profile_pic   | VARCHAR   | Profile picture URL        |
| created_at    | TIMESTAMP | Account creation time      |

- **sessions**
| Field         | Type      | Description                |
|---------------|-----------|----------------------------|
| id            | VARCHAR   | Unique session ID (UUID)   |
| user_id       | INT (FK)  | Linked user                |
| created_at    | TIMESTAMP | Session creation time      |

- **user_surf_sessions**
| Field         | Type      | Description                |
|---------------|-----------|----------------------------|
| id            | INT (PK)  | Unique surf session ID     |
| user_id       | INT (FK)  | Linked user                |
| title         | VARCHAR   | Session title              |
| location      | VARCHAR   | Beach name                 |
| start         | DATETIME  | Start time                 |
| end           | DATETIME  | End time                   |
| rating        | INT       | User rating (1-5)          |

---

## 4. API Endpoints

### Authentication

- `POST /signup`  
  Register a new user. Returns JWT token.

- `POST /login`  
  Authenticate user. Returns JWT token.

- `GET /api/user`  
  Get current user profile (requires JWT).

---

### Surf Sessions

- `GET /api/profile/session`  
  Get all surf sessions for the current user.

- `POST /api/profile/session`  
  Add a new surf session.

- `PATCH /api/profile/session/{session_id}`  
  Update an existing surf session.

---

### Environmental & Crowd Forecast

- `GET /api/environmental-summary?beach_id=...`  
  Get current and forecasted environmental data for a beach.

- `GET /api/environmental-conditions?beach_id=...&start=...&end=...`  
  Get environmental conditions for a beach and time window.

- `GET /api/crowd/hourly?beach_index=...&start_date=...&end_date=...`  
  Get hourly crowd forecast for a beach.

- `GET /api/crowd/daily?beach_index=...&start_date=...&end_date=...`  
  Get daily summary of crowd forecast for a beach.

---

### Camera Feed

- `GET /api/camera`  
  Returns camera stream HTML.

- `GET /video_feed`  
  (Optional) Streams live camera feed (MJPEG).

---

## 5. Environmental & Crowd Forecasting

- **Weather & Marine Data:**  
  Uses Open-Meteo API for hourly/daily weather, wind, tide, and marine conditions.
- **Crowd Model:**  
  XGBoost regression model predicts crowdedness using environmental features, time, and holiday info.
- **Data Aggregation:**  
  Hourly predictions are summarized into daily stats (mean, median, peak, low/peak times).

---

## 6. Security

- **Authentication:**  
  JWT tokens for all protected endpoints.
- **Password Storage:**  
  Hashed with bcrypt.
- **CORS:**  
  Enabled for all origins (can be restricted in production).

---

## 7. Deployment

- **Docker:**  
  Backend runs in a container with all dependencies.
- **Environment Variables:**  
  Managed via `.env` file (see `.env.example`).

---

## 8. Extensibility

- Modular code for easy addition of new endpoints or models.
- ML models can be updated independently in the `models/` directory.
- Database schema can be extended for new features.

---

## 9. Example Data Flow

**Adding a Surf Session:**
1. User submits session via frontend.
2. Frontend sends POST to `/api/profile/session` with JWT.
3. Backend validates, stores session in `user_surf_sessions`.
4. Returns new session data to frontend.

**Getting Crowd Forecast:**
1. Frontend requests `/api/crowd/hourly` or `/api/crowd/daily`.
2. Backend fetches weather/marine data, runs ML model, returns forecast.

---

## 10. References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Open-Meteo API](https://open-meteo.com/)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---