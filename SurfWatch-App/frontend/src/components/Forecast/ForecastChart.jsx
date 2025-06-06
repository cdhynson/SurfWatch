import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, YAxis, ResponsiveContainer
} from 'recharts';

import "./Forecast.css"


function ForecastChart({name,beach, timeUnit}) {

  const [data, setData] = useState([]);

  // dummy data for now
  useEffect(() => {
    setData([
      { time: '12pm', value: 10 },
      { time: '1pm', value: 20 },
      { time: '2pm', value: 22 },
      { time: '3pm', value: 100 },
      { time: '4pm', value: 68 },
      { time: '4pm', value: 80 },
      { time: '5pm', value: 55 }
      
    ]);
  }, []);


  return (
    <div className="forecast-container">
    <h3 className="beach-name">{name}</h3>
    <div className= "forecast-chart">
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="30%" stopColor="#90c3d4" stopOpacity={1} />
              <stop offset="100%" stopColor="#90c3d4" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, 100]} />
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
        {Array.from({ length: data.length + 1 }).map((_, i) => (
          <div
            key={`bar-${i}`}
            style={{
              width: '6px',
              backgroundColor: 'white',
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
          display: timeUnit === "days" ? 'flex' : 'none',
          justifyContent: 'space-around',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 2,
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
        }}
      >
        {data.map((d, i) => (
          <span key={`label-${i}`} style={{ textAlign: 'center' }}>
            {d.value}%
          </span>
        ))}
      </div>
    </div>
    </div>
  );
}

export default ForecastChart;