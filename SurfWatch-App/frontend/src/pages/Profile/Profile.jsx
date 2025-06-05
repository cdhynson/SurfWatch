import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import SessionCard from "../../components/Profile/SessionCard";
import "./Profile.css";

function Profile() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Summary, 1 = Sessions
  const [showModal, setShowModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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

  }, []);

  const handleSession = (e) => {
    e.preventDefault();
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
            Authorization: `Bearer ${token}`
          },
        }
      )
      .then((res) => {
        setSessions([...sessions, res.data]);
        setShowModal(false);
        setTitle("");
        setLocation("");
        setStartTime("");
        setEndTime("");
        setRating("");
      })
      .catch(() => alert("Failed to add sessions:"));
  };

  const renderTabContent = () => {
    if (activeTab === 0) {
      return <div className="summary-content"></div>;
    } else {
      return (
        <div className="sessions-content">
          {sessions.map((session, idx) => (
            <SessionCard
              key={idx}
              title={session.title}
              dateTime={`${session.start} to ${session.end}`}
              location={session.location}
              rating={session.rating}
              waveHeight={session.wave}
              tide={session.tide}
              wind={session.wind}
              waterTemp={session.water}
            />
          ))}
        </div>
      );
    }
  };

  return (
    <>
      <TopNav />
      <div className="profile-container">
        <div className="profile-header">
          <span id="surf-streak">
            <img src="/assets/fire.svg" alt="Flame Icon" />
            <p>3 DAY SURFING STREAK</p>
          </span>

          <div className="pfp-section">
            <div className="pfp" />
            <img src="/assets/pfp.svg" alt="Profile" />
            <button className="edit-pfp">
              <img src="/assets/edit.svg" alt="Edit" />
            </button>
          </div>

          <h2 className="user-name">{username}</h2>

          <div className="skill-container">
            <img src="/assets/intermediate.svg" alt="Skill Bar" />
            <p id="skill-label">INTERMEDIATE</p>
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
                placeholder="Surfed with Sharks"
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
                <option value="lowerTrestles">Lower Trestles</option>
                <option value="scripps">Scripps</option>
                <option value="laJolla">La Jolla</option>
                <option value="delMar">Del Mar</option>
                <option value="blacks">Blacks</option>
              </select>
            </div>
            <div>
              <label htmlFor="start">From</label>
              <input
                type="datetime-local"
                id="start"
                name="start"
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
