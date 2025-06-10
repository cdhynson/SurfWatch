import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { computeSurfStreak, getCurrentDateTimeLocal } from "../../utils.js";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import SessionCard from "../../components/Sessions/SessionCard.jsx";
import "./Profile.css";

function Profile() {
  const [activeTab, setActiveTab] = useState(1); // 0 = Summary, 1 = Sessions
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
      .catch(() =>{ 
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

  const renderTabContent = () => {
    if (activeTab === 0) {
      return <div className="summary-content">
      </div>;
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

const streak = React.useMemo(() => computeSurfStreak(sortedSessions), [sortedSessions]);


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
        <div className="session-modal" >
          <form onSubmit={handleSession} >
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
