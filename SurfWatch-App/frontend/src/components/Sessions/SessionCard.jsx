import React, { useState, useEffect } from "react";
import "./SessionCard.css";
import axios from "axios";

const BEACHES = {
  "Lower Trestles": 1,
  "Scripps": 2,
  "La Jolla": 3,
  "Del Mar": 4,
  "Blacks": 5,
  "Cardiff": 6,
};

function SessionCard({ title, start, end, location, rating }) {
  const API_BASE = process.env.REACT_APP_API_URL;

  const [stats, setStats] = useState({
    waveHeight: 0,
    tide: 0,
    wind: 0,
    waterTemp: 0,
  });

  useEffect(() => {
    const beachId = BEACHES[location];
    if (!beachId) return;

    axios
      .get(`${API_BASE}/api/environmental-conditions`, {
        params: { beach_id: beachId, start, end },
      })
      .then((res) => {
        setStats({
          waveHeight: res.data.wave_height,
          waterTemp: res.data.temperature_2m,
          tide: res.data.tide,
          wind: res.data.wind_speed,
        });
      })
      .catch(() => {});
  }, [location, start, end, API_BASE]);

  const renderStars = () =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i + 1} className={`star${i + 1 <= rating ? " filled" : ""}`}>
        ★
      </span>
    ));

  const formatSessionTime = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startStr = startDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const endStr = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${startStr} to ${endStr}`;
  };

  return (
    <div className="session-card">
      <div className="session-top">
        <div className="session-title">{title}</div>
        <div className="session-rating">{renderStars()}</div>
      </div>
      <div className="session-details">
        <div className="session-line">
          <img src="/assets/wave.svg" alt="wave icon" />
          <p>{formatSessionTime(start, end)}</p>
        </div>
        <div className="session-line">
          <img src="/assets/umbrella.svg" alt="Beach icon" />
          <p>{location}</p>
        </div>
      </div>
      <div className="session-stats">
        <div className="stat">
          <p className="stat-label">Wave Height</p>
          <p className="stat-value">{stats.waveHeight} ft</p>
        </div>
        <div className="stat">
          <p className="stat-label">Tide</p>
          <p className="stat-value">{stats.tide} ft</p>
        </div>
        <div className="stat">
          <p className="stat-label">Wind</p>
          <p className="stat-value">{stats.wind} mph</p>
        </div>
        <div className="stat">
          <p className="stat-label">Temperature</p>
          <p className="stat-value">{stats.waterTemp}°f</p>
        </div>
      </div>
    </div>
  );
}

export default SessionCard;
