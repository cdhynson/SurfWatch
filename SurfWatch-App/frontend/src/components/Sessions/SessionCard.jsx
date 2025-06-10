import React, {useState, useEffect} from "react";
import "./SessionCard.css";
import axios from "axios";

function SessionCard({
  title,
  start,
  end,
  location,
  rating,
}) {
  const API_BASE = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  const [waveHeight, setWaveHeight] = useState(0);
  const [tide, setTide] = useState(0);
  const [wind, setWind] = useState(0);
  const [waterTemp, setWaterTemp] = useState(0);

  
  useEffect(()=>{
    const BEACHES = {
    "Lower Trestles": { id: 1},
    "Scripps": { id: 2 },
    "La Jolla": { id: 3 },
    "Del Mar": { id: 4},
    "Blacks": { id:5},
    "Cardiff": {id:6}
    }
    console.log(location)


    axios
      .get(`${API_BASE}/api/environmental-conditions`, {
        params: {
          beach_id: BEACHES[location].id,
          start: start,
          end: end,
        }
      })
      .then((res)=> {
        setWaveHeight(res.data.wave_height);
        setWaterTemp(res.data.temperature_2m);
        setTide(res.data.tide);
        setWind(res.data.wind_speed);
      })
      .catch()
  }, [location, start,end, API_BASE])

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
          <p>{formatSessionTime(start,end)}</p>
        </div>
        <div className="session-line">
          <img src="/assets/umbrella.svg" alt="Beach icon" />
          <p>{location}</p>
        </div>
      </div>

      <div className="session-stats">
        <div className="stat">
          <p className="stat-label">Wave Height</p>
          <p className="stat-value">{waveHeight} ft</p>
        </div>
        <div className="stat">
          <p className="stat-label">Tide</p>
          <p className="stat-value">{tide} ft</p>
        </div>
        <div className="stat">
          <p className="stat-label">Wind</p>
          <p className="stat-value">{wind} mph</p>
        </div>
        <div className="stat">
          <p className="stat-label">Temperature</p>
          <p className="stat-value">{waterTemp}°f</p>
        </div>
      </div>
    </div>
  );
}

export default SessionCard;
