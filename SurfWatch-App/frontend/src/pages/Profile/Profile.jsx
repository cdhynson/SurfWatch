import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { computeSurfStreak, getCurrentDateTimeLocal } from "../../utils.js";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import SessionCard from "../../components/Sessions/SessionCard.jsx";
import "./Profile.css";

function Profile() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Summary, 1 = Sessions
  const [showModal, setShowModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [title, setTitle] = useState("Surfed with Sharks");
  const [location, setLocation] = useState("Lower Trestles");
  const [startTime, setStartTime] = useState(getCurrentDateTimeLocal());
  const [endTime, setEndTime] = useState(getCurrentDateTimeLocal());
  const [rating, setRating] = useState(0);

  const [username, setUsername] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/profile/session`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSessions(res.data))
      .catch(() => navigate("/login"));

    axios
      .get(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log(res.data.username);
        setUsername(res.data.username);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [API_BASE, token, navigate]);

  const handleSession = (e) => {
    e.preventDefault();

    // Convert to Date objects for comparison
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      alert("End time must be after start time.");
      return; // Prevent sending request
    }

    axios
      .post(
        `${API_BASE}/api/profile/session`,
        {
          title: title,
          location: location,
          rating: rating,
          start: startTime,
          end: endTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        setSessions([...sessions, res.data]);
        setShowModal(false);
        setTitle("Surfed with Sharks");
        setLocation("Lower Trestles");
        setStartTime(getCurrentDateTimeLocal());
        setEndTime(getCurrentDateTimeLocal());
        setRating(0);
      })
      .catch(() => alert("Failed to add sessions:"));
  };

  const renderStars = (rating) => {
    const filledCount = Math.floor(rating); // number of fully filled stars
    const halfStar = rating - filledCount >= 0.5; // optional, if you want half stars (skip for now)
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= filledCount ? "filled" : ""}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const renderTabContent = () => {
    if (activeTab === 0) {
      return (
        <div className="summary-content">
          <section className="top-beaches-section">
            <h3>Top Beaches</h3>
            <h4>Your top rated beaches over the month</h4>
            <ol className="top-beaches-list">
              {mostVisitedBeaches.map((b) => (
                <li className="top-beaches-item" key={b.name}>
                  <p className="beach-rank">{b.index}</p>
                  <p className="beach-spot"> {b.name}</p>
                  <div className="stars-rating">{renderStars(b.rating)}</div>
                  <span className="rating-value">({b.rating})</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="monthly-hours-chart">
            <h3>Monthly Surf Trend</h3>
            <h4>Hours you've surfed this month</h4>
            <div
              className="chart-container"
              style={{ width: "90vw", height: 250 }}
            >
              <ResponsiveContainer>
                <AreaChart data={hoursPerDay}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#1E90FF"
                    fill="#ADD8E6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      );
    } else {
      return (
        <div className="sessions-content">
          {sessions.map((session, idx) => (
            <SessionCard
              key={idx}
              title={session.title}
              start={session.start}
              end={session.end}
              location={session.location}
              rating={session.rating}
            />
          ))}
        </div>
      );
    }
  };

  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.start) - new Date(a.start));
  }, [sessions]);

  const streak = React.useMemo(
    () => computeSurfStreak(sortedSessions),
    [sortedSessions]
  );

  const mostVisitedBeaches = React.useMemo(() => {
    const counts = {};
    sessions.forEach((s) => {
      if (!counts[s.location]) {
        counts[s.location] = { count: 0, totalRating: 0 };
      }
      counts[s.location].count += 1;
      counts[s.location].totalRating += s.rating;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([location, data], index) => ({
        name: location,
        rating: (data.totalRating / data.count).toFixed(1),
        count: data.count,
        index: index + 1,
      }));

    return sorted;
  }, [sessions]);

  const totalSessions = sessions.length;

  const avgSessionLength = React.useMemo(() => {
    if (!sessions.length) return 0;
    const totalHours = sessions.reduce((acc, s) => {
      const start = new Date(s.start);
      const end = new Date(s.end);
      return acc + (end - start) / (1000 * 60 * 60); // convert ms to hours
    }, 0);
    return totalHours / sessions.length;
  }, [sessions]);

  const formatDate = (dateStr) => {
    const localDate = new Date(dateStr + "T00:00:00"); // Ensures it's parsed as local
    const month = localDate.toLocaleString("en-US", { month: "short" });
    const day = localDate.getDate();
    return `${month} ${day}`;
  };

  const totalHours = React.useMemo(() => {
    return sessions.reduce((acc, s) => {
      const start = new Date(s.start);
      const end = new Date(s.end);
      return acc + (end - start) / (1000 * 60 * 60); // convert ms to hours
    }, 0);
  }, [sessions]);

  const hoursPerDay = React.useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const date = new Date(s.start);
      const day = date.toISOString().slice(0, 10); // YYYY-MM-DD
      const duration = (new Date(s.end) - new Date(s.start)) / (1000 * 60 * 60); // in hours
      map[day] = (map[day] || 0) + duration;
    });

    return Object.entries(map)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([day, hours]) => ({
        date: formatDate(day),
        hours: +hours.toFixed(2),
      }));
  }, [sessions]);

  return (
    <>
      <TopNav />
      <div className="profile-container">
        <div className="profile-header">
          <span id="surf-streak" style={{ opacity: streak === 0 ? 0.5 : 1 }}>
            <img src="/assets/fire.svg" alt="Flame Icon" />
            <p>{streak} DAY SURFING STREAK</p>
          </span>
          <div className="pfp-section">
            <div className="pfp-wrapper">
              <img src="/assets/pfp.svg" alt="Profile" className="pfp" />
              <button className="edit-pfp">
                <img src="/assets/edit.svg" alt="Edit" />
              </button>
            </div>
          </div>

          <h2 className="user-name">{username}</h2>
          <div className="surf-stats-row">
            <div className="surf-stat">
              <h4>Total Sessions</h4>
              <p>{totalSessions}</p>
            </div>
            <div className="surf-stat highlight">
              <h4>Total Hours</h4>
              <p>{totalHours.toFixed(1)} hrs</p>
            </div>
            <div className="surf-stat">
              <h4>Avg Session</h4>
              <p>{avgSessionLength.toFixed(1)} hrs</p>
            </div>
          </div>

          <button
            className="add-session-btn"
            onClick={() => setShowModal(true)}
          >
            Add Session
          </button>
        </div>

        <div className="tab-row">
          <span
            id="summary"
            className={activeTab === 0 ? "active-tab" : ""}
            onClick={() => setActiveTab(0)}
          >
            <p>Summary</p>
          </span>
          <span
            id="sessions"
            className={activeTab === 1 ? "active-tab" : ""}
            onClick={() => setActiveTab(1)}
          >
            <p>Sessions</p>
          </span>
        </div>

        <div id="tab-content">{renderTabContent()}</div>
      </div>

      {showModal && (
        <div className="session-modal">
          <form onSubmit={handleSession}>
            <button
              type="button"
              className="close-modal"
              onClick={() => setShowModal(false)}
            >
              x
            </button>
            <h1>Add New Session</h1>
            <div>
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="location">Location</label>
              <select
                id="location"
                name="location"
                placeholder="Select a spot"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="Lower Trestles">Lower Trestles</option>
                <option value="Scripps">Scripps</option>
                <option value="La Jolla">La Jolla</option>
                <option value="Del Mar">Del Mar</option>
                <option value="Blacks">Blacks</option>
                <option value="Cardiff">Cardiff</option>
              </select>
            </div>
            <div>
              <label htmlFor="start">From</label>
              <input
                type="datetime-local"
                id="start"
                name="start"
                defaultValue={""}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="end">To</label>
              <input
                type="datetime-local"
                id="end"
                name="end"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="rating">Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= rating ? "star filled" : "star"}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <input type="submit" value="Submit" />
          </form>
        </div>
      )}
      <BottomNav />
    </>
  );
}

export default Profile;
