import React from "react";
import "./SessionCard.css";

function SessionCard({
  title,
  dateTime,
  location,
  waveHeight,
  tide,
  wind,
  waterTemp,
  rating,
}) {
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? "filled" : ""}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="session-card">
      <div className="session-top">
        <div className="session-title">{title}</div>
        <div className="session-rating">{renderStars()}</div>
      </div>
      <div className="session-details">
        <div className="session-line">
          {/* <img src="/assets/wave.svg" alt="wave icon" /> */}
          <p>{dateTime}</p>
        </div>
        <div className="session-line">
          {/* <img src="/assets/beach.svg" alt="Beach icon" /> */}
          <p>{location}</p>
        </div>
      </div>

      <div className="session-stats">
        <div className="stat">
          <p className="stat-label">Wave Height</p>
          <p className="stat-value">{waveHeight}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Tide</p>
          <p className="stat-value">{tide}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Wind</p>
          <p className="stat-value">{wind}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Temperature</p>
          <p className="stat-value">{waterTemp}</p>
        </div>
      </div>
    </div>
  );
}

export default SessionCard;
