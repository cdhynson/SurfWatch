import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { degreesToCompass } from "../../utils.js";

import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";

import BottomSheet from "../../components/Forecast/ForecastSheet";
import ForecastChart from "../../components/Forecast/ForecastChart";

import "./Explore.css";

function Explore() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const API_BASE = process.env.REACT_APP_API_URL;

  const [beachID, setBeachID] = useState(1);
  const [beach, setBeach] = useState("Lower Trestles");
  const [beachURL, setBeachURL] = useState(
    "https://camrewinds.cdn-surfline.com/oregon/wc-lowers.stream.20250608T014558086.mp4"
  );

  const [environment, setEnvironment] = useState({
    temp: 60,
    weather: "sunny",
    windSpeed: 0,
    windDirection: 0,

    waterTemp: 0,
    waveHeight: 0,
    tide: 0,

    swellHeight: 0,
    swellDirection: 0,
    swellPeriod: 0,

    sunrise: "",
    sunset: "",
    uvIndex: 0,
  });

  const formatTime = (date) => {
    const newDate = new Date(date);

    const newStr = newDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return newStr;
  };


  useEffect(() => {
    if (location.state) {
      const { beachID, beachName, beachURL } = location.state;
      setBeachID(beachID);
      setBeach(beachName);
      setBeachURL(beachURL);
      setOpen(true); // automatically open sheet when navigated with state
    }

    axios
      .get(`${API_BASE}/api/environmental-summary`, {
        params: {
          beach_id: beachID,
        },
      })
      .then((res) => {
        setEnvironment({
          temp: res.data.temperature_2m,
          weather: res.data.weather_description,
          windSpeed: res.data.wind_speed,
          windDirection: res.data.wind_direction,

          waterTemp: res.data.sea_surface_temperature,
          waveHeight: res.data.wave_height,
          tide: res.data.tide,

          swellHeight: res.data.swell_height,
          swellDirection: res.data.swell_direction,
          swellPeriod: res.data.swell_period,

          sunrise: res.data.sunrise,
          sunset: res.data.sunset,
          uvIndex: res.data.uv_max,
        });
      })
      .catch((error) => {
        console.error("Error fetching conditions:", error);
      });
  }, [location.state, API_BASE]);

  function getSurfAttire(waterTempF) {
  if (typeof waterTempF !== "number" || isNaN(waterTempF)) {
    return "Unknown (invalid temperature)";
  }

  if (waterTempF > 72) {
    return "Rashguard";
  } else if (waterTempF >= 65 && waterTempF <= 75) {
    return "2mm";
  } else if (waterTempF >= 62 && waterTempF < 68) {
    return "3/2mm";
  } else if (waterTempF >= 58 && waterTempF < 63) {
    return "4/3mm";
  } else {
    return "5/4mm";
  }
}

  return (
    <>
      <TopNav />
      <div className="explore-container">
        <button onClick={() => setOpen(true)}>Open Bottom Sheet</button>
        <BottomSheet open={open} onDismiss={() => setOpen(false)}>
          <span className="sheet-header">
            <h2>Crowd Forecast</h2>
            <span className="weather">
              <img
                src={`./assets/${environment.weather}.svg`}
                alt={environment.weather}
              />
              <p>{environment.temp}°</p>
            </span>
          </span>
          <h3>{beach}, San Diego</h3>
          <div className="forecast-graph">
            <ForecastChart name={beach} beach={beachID} timeUnit={"hours"} />
          </div>
          <div className="beach-vid">
            <div className="video-wrapper">
              <h3>{beach} Live Cam</h3>
              <video src={beachURL} controls></video>
            </div>
          </div>
          <section className="cond-section">
            {/* Sun + UV */}
            <div className="card">
              <div className="condition-row">
                <span className="sun-time">
                <img src="./assets/sunrise.svg" alt="Sunrise" />
                <div>
                  <p className="label">Sunrise</p>
                  <p className="value">{formatTime(environment.sunrise)}</p>
                </div>
              </span>
              <span className="sun-time">
                <img src="./assets/sunset.svg" alt="Sunset" />
                <div>
                  <p className="label">Sunset</p>
                  <p className="value">{formatTime(environment.sunset)}</p>
                </div>
              </span>
              </div>
              
              <div className="uv-index">
                <p>Max UV Index:</p> <strong>{environment.uvIndex}</strong>
              </div>
            </div>

            {/* Conditions */}
            <div className="card-row">
              <div className="card">
                <h4>{getSurfAttire(environment.waterTemp)} wetsuit recommended</h4>
                <div className="condition-item">
                  <img src="./assets/droplet.svg" alt="Water Temp" />
                  <p className="value">{environment.waterTemp}°f</p>
                </div>
                <div className="condition-item">
                  <img src="./assets/wave-height.svg" alt="Wave Height" />
                  <p className="value">{environment.waveHeight} ft</p>
                </div>
                
              </div>
              <div className="card">
              <div className="wind-info">
                <h4>Wind</h4>
                <p>{environment.windSpeed} mph {degreesToCompass(environment.windDirection)}</p>
              </div>

              <div className="swell-info">
                <h4>Swell</h4>
                <p>{environment.swellHeight}ft {environment.swellPeriod}s {degreesToCompass(environment.swellDirection)}</p>
              </div>
              </div>
            </div>

          </section>
        </BottomSheet>
      </div>
      <BottomNav />
    </>
  );
}

export default Explore;
