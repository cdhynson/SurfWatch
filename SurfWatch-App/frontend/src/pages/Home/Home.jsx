import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import ForecastChart from "../../components/Forecast/ForecastChart.jsx";
import BeachCam from "../../components/Home/BeachCam.jsx";
import { getCurrentDateTimeLocal, computeSurfStreak } from "../../utils.js";
import { EditSessionModal } from "../../components/Sessions/SessionsModal.jsx";

import "./Home.css";

function Home() {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const sessionToEdit = useMemo(
    () => sessions.find((s) => s.id === activeSessionId),
    [sessions, activeSessionId]
  );

  useEffect(() => {
    if (!token) {
      setLoggedIn(false);
      return;
    }
    axios
      .get(`${API_BASE}/api/profile/session`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSessions(res.data);
        setLoggedIn(true);
      })
      .catch(() => setLoggedIn(false));
  }, [API_BASE, token]);

  const startSession = () => {
    const now = getCurrentDateTimeLocal();
    axios
      .post(
        `${API_BASE}/api/profile/session`,
        {
          start: now,
          title: "Surfed with Sharks",
          location: "Lower Trestles",
          rating: 1,
          end: now,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        setActiveSessionId(res.data.id);
        setSessions((prev) => [...prev, res.data]);
      })
      .catch(() => alert("Failed to start session"));
  };

  const endSession = () => setShowModal(true);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.start) - new Date(a.start)),
    [sessions]
  );

  const streak = useMemo(
    () => computeSurfStreak(sortedSessions),
    [sortedSessions]
  );

  const beaches = [
    {
      name: "Lower Trestles",
      value: 1,
      url: "https://camrewinds.cdn-surfline.com/oregon/wc-lowers.stream.20250608T014558086.mp4",
    },
    {
      name: "Scripps",
      value: 2,
      url: "https://camrewinds.cdn-surfline.com/oregon/wc-church.stream.20250608T014911508.mp4",
    },
  ];

  const allDays = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  const todayIndex = new Date().getDay();
  const days = [...allDays.slice(todayIndex), ...allDays.slice(0, todayIndex)];

  return (
    <>
      <TopNav />
      <div className="home-container">
        {/* Check-In */}
        <section className="checkin-section">
          <span id="surf-streak" style={{ opacity: streak === 0 ? 0.5 : 1 }}>
            <img src="/assets/fire.svg" alt="Flame Icon" />
            <p>{streak} DAY SURFING STREAK</p>
          </span>
          {!loggedIn ? (
            <button
              className="checkin-button"
              onClick={() => navigate("/login")}
              style={{ background: "#29324179" }}
            >
              <h2>Login to start session</h2>
            </button>
          ) : (
            <button
              className="checkin-button"
              onClick={activeSessionId ? endSession : startSession}
            >
              <h2>{activeSessionId ? "End Session" : "Start Session"}</h2>
            </button>
          )}
        </section>

        {/* Beach Cam */}
        <section className="beachcam-section">
          <h2>Beach Cams</h2>
          <div className="carousel">
            <div className="carousel-item">
              <img
                src="https://86c902c06c05.ngrok.app/video_feed"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/assets/beach-placeholder.png";
                }}
                alt="Live Cam"
                style={{ objectFit: "cover" }}
              />
              <div className="beachcam-label">
                <h3>Live Cam</h3>
                <span className="beach-crowds">
                  <p>Lowest Crowds: 10am</p>
                  <p>Peak Crowds: 8pm</p>
                </span>
              </div>
            </div>
            {beaches.map((beach) => (
              <BeachCam
                key={beach.value}
                name={beach.name}
                beach={beach.value}
                url={beach.url}
              />
            ))}
          </div>
        </section>

        {/* Crowd Forecast Section */}
        <section className="forecast-section">
          <h2>Crowd Density Forecast</h2>
          <span className="forecast-days">
            {days.map((d, i) => (
              <p key={`label-${i}`}>{d}</p>
            ))}
          </span>
          {beaches.map((beach) => (
            <ForecastChart
              key={beach.value}
              name={beach.name}
              beach={beach.value}
              timeUnit="days"
            />
          ))}
        </section>
      </div>

      {showModal && sessionToEdit && (
        <EditSessionModal
          sessionId={activeSessionId}
          initialData={sessionToEdit}
          token={token}
          API_BASE={API_BASE}
          onClose={() => {
            setShowModal(false);
            setActiveSessionId(null);
          }}
          onSuccess={() => {
            axios
              .get(`${API_BASE}/api/profile/session`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((res) => setSessions(res.data));
          }}
        />
      )}

      <BottomNav />
    </>
  );
}

export default Home;
