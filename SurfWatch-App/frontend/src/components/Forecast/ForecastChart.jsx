import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, YAxis, XAxis, ResponsiveContainer
} from 'recharts';
import axios from "axios"

import "./Forecast.css"


function ForecastChart({name,beach, timeUnit}) {
  
  const [data, setData] = useState([]);
  const API_BASE = process.env.REACT_APP_API_URL;
  const [maxValue, setMaxValue] = useState(100);
  const [minValue, setMinValue] = useState(0);


  useEffect(() => {
  const start_date = new Date();
  const end_date =
    timeUnit === "days"
      ? new Date(new Date().setDate(start_date.getDate() + 6))
      : new Date(new Date().setDate(start_date.getDate() + 1));

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const computedRoute =
    timeUnit === "days" ? "/api/crowd/daily" : "/api/crowd/hourly";

  axios
    .get(`${API_BASE}${computedRoute}`, {
      params: {
        beach_index: beach,
        start_date: formatDate(start_date),
        end_date: formatDate(end_date),
      },
    })
    .then((res) => {
      let results = res.data;

      // If hourly, filter to only include now -> now + 10 hours
      if (timeUnit !== "days") {
  const now = new Date();
  const currentHour = now.getHours();
  const tenHoursFromNow = currentHour + 8;

  results = results.filter((entry) => {
      // Parse entry.time like "8am", "12pm" etc.
      const match = entry.time.match(/^(\d+)(am|pm)$/);
      if (!match) return false;

      let hour = parseInt(match[1]);
      const period = match[2];

      if (period === "pm" && hour !== 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;

      const entryDate = new Date(entry.date);
      entryDate.setHours(hour, 0, 0, 0);

      return (
        entryDate.getDate() === now.getDate() &&
        hour >= currentHour &&
        hour <= tenHoursFromNow
      );
    });
  }

      setData(results);
      if (results.length > 0) {
        setMaxValue(Math.max(...results.map((item) => item.value)));
        setMinValue(Math.min(...results.map((item) => item.value)));
      }
    })
    .catch((error) => {
      console.error("Error fetching forecast:", error);
    });
}, [timeUnit, beach]);

  return (
    <div className="forecast-container"
    style={{boxShadow: timeUnit === "days" ? "0px 1px 3px 2px rgba(0, 0, 0, 0.06)" : 'none'}}>
    <h3 className="beach-name" style={{display: timeUnit === "days" ? "flex" : "none"}}>{name}</h3>
    <div className= "forecast-chart">
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="30%" stopColor="#90c3d4" stopOpacity={1} />
              <stop offset="100%" stopColor="#90c3d4" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <YAxis hide domain={[minValue/1.5, maxValue]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#colorWave)"
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Segmentation overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {/* Vertical white segment dividers */}
        {Array.from({ length: timeUnit === "days" ? 8 : 10 }).map((_, i) => (
          <div
            key={`bar-${i}`}
            style={{
              width: '.25em',
              backgroundColor: '#fbfbfb',
              height: '100%',
            }}
          />
        ))}
      </div>

      {/* Centered data labels */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 2,
          fontSize: timeUnit === "days" ?'16px' : '14px',
          fontWeight: '600',
          color: '#5D696D',
        }}
      >
        {data.map((d, i) => (
          <span key={`label-${i}`} style={{ textAlign: 'center' }}>
            {d.value}
          </span>
        ))}
      </div>
      {/* Custom X-axis time labels for hourly view */}
    {timeUnit !== "days" && (
      <div
        style={{
          position: 'absolute',
          bottom: '-20px', // or adjust for spacing
          left: 0,
          right: 0,
          height: '20px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderTop: '1px solid #ccc',
          fontSize: '12px',
          color: '#5D696D',
          background: '#fbfbfb',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {data.map((d, i) => (
          i % 3 === 0 ? (
            <span key={`time-${i}`} style={{ textAlign: 'center', flex: 1 }}>
              {d.time}
            </span>
          ) : (
            <span key={`time-${i}`} style={{ flex: 1 }} />
          )
        ))}
      </div>
    )}

    </div>
    </div>
  );
}

export default ForecastChart;