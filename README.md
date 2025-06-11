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

## Learn More

- [React documentation](https://reactjs.org/)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [Docker Compose docs](https://docs.docker.com/compose/)

---