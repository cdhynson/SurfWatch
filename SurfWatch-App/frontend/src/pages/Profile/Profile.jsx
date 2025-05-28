import React, { useState } from "react";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import SessionCard from "../../components/Profile/SessionCard";

import "./Profile.css";

function Profile() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Summary, 1 = Sessions

  const renderTabContent = () => {
    if (activeTab === 0) {
      return (
        <div className="summary-content">
        </div>
      );
    } else {
      return (
        // Placeholder values for now
        <div className="sessions-content">
          <SessionCard
            title="Surfed with Kat"
            dateTime="Today from 10:38 AM to 1:13 PM"
            location="La Jolla Shores"
            waveHeight="2 - 3ft+"
            tide="3.6ft"
            wind="5kts SSE"
            temperature="64°F"
            rating={3}
          />
          <SessionCard
            title="Surfed with a Shark"
            dateTime="Yesterday from 10:38 AM to 1:13 PM"
            location="Del Mar"
            waveHeight="2 - 3ft+"
            tide="3.6ft"
            wind="5kts SSE"
            temperature="64°F"
            rating={4}
          />
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

          <h2 className="user-name">Jane Doe</h2>

          <div className="skill-container">
            <img src="/assets/intermediate.svg" alt="Skill Bar" />
            <p id="skill-label">INTERMEDIATE</p>
          </div>

          <button className="add-session-btn">Add Session</button>
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

        <div id="tab-content">
          {renderTabContent()}
        </div>
      </div>
      <BottomNav />
    </>
  );
}

export default Profile;
