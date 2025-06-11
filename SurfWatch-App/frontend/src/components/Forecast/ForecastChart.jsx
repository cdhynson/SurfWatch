import React, { useEffect, useState } from "react";
import { AreaChart, Area, YAxis, ResponsiveContainer } from "recharts";
import axios from "axios";
import "./Forecast.css";

function ForecastChart({ name, beach, timeUnit }) {
  const [data, setData] = useState([]);
  const API_BASE = process.env.REACT_APP_API_URL;
  const [maxValue, setMaxValue] = useState(100);
  const [minValue, setMinValue] = useState(0);

  useEffect(() => {
    const startDate = new Date();
    const endDate = new Date(
      startDate.setDate(
        startDate.getDate() + (timeUnit === "days" ? 6 : 1)
      )
    );

    const formatDate = (date) =>
      `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;

    const computedRoute =
      timeUnit === "days" ? "/api/crowd/daily" : "/api/crowd/hourly";

    axios
      .get(`${API_BASE}${computedRoute}`, {
        params: {
          beach_index: beach,
          start_date: formatDate(new Date()),
          end_date: formatDate(endDate),
        },
      })
      .then((res) => {
        let results = res.data;

        if (timeUnit !== "days") {
          const now = new Date();
          const currentHour = now.getHours();
          const tenHoursFromNow = currentHour + 8;

          results = results.filter((entry) => {
            const match = entry.time.match(/^(\d+)(am|pm)$/);
            if (!match) return false;

            let hour = parseInt(match[1], 10);
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
  }, [timeUnit, beach, API_BASE]);

  return (
    <div
      className={`forecast-container${
        timeUnit === "days" ? " forecast-container--days" : ""
      }`}
    >
      {timeUnit === "days" && <h3 className="beach-name">{name}</h3>}
      <div className="forecast-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="30%" stopColor="#90c3d4" stopOpacity={1} />
                <stop offset="100%" stopColor="#90c3d4" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[minValue / 1.5, maxValue]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill="url(#colorWave)"
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="forecast-segments">
          {Array.from({
            length: timeUnit === "days" ? 8 : 10,
          }).map((_, i) => (
            <div
              key={`bar-${i}`}
              className="forecast-segment-bar"
            />
          ))}
        </div>

        <div
          className={`forecast-labels${
            timeUnit === "days" ? " forecast-labels--days" : ""
          }`}
        >
          {data.map((d, i) => (
            <span key={`label-${i}`} className="forecast-label">
              {d.value}
            </span>
          ))}
        </div>

        {timeUnit !== "days" && (
          <div className="forecast-xlabels">
            {data.map((d, i) =>
              i % 3 === 0 ? (
                <span
                  key={`time-${i}`}
                  className="forecast-xlabel"
                >
                  {d.time}
                </span>
              ) : (
                <span key={`time-${i}`} className="forecast-xlabel" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForecastChart;