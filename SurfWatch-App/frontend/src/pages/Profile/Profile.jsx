import React from "react";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import "./Profile.css";

function Profile() {
  return (
    <>
      <TopNav />
      <div className="profile-container">
      <span id="surf-streak">
            <img src="/assets/fire.svg" alt="Flame Icon" />
            <p> 3 DAY SURFING STREAK</p>
            </span>

        <div className="pfp-section">
          <div className="pfp"/>
          <img src="/assets/pfp.svg" alt="Flame Icon" />
          <button className="edit-pfp"><img src="/assets/edit.svg" alt="Flame Icon" /></button>
        </div>

        <h2 className="user-name">Jane Doe</h2>
      <div className="skill-container">
        <span className="skill-bar">
          <span id="skill-r-filled" />
          <span id="skill-m-filled" />
          <span id="skill-l" />
        </span>
        <p className="skill-label">INTERMEDIATE</p>
      </div>
        <button className="add-session-btn">Add Session</button>

        <div className="tab-row">
          <span className="tab-active">Summary</span>
          <span className="tab">Sessions</span>
        </div>
        <div className="summary">

        </div>
        <div className="sessions-card">
          
        </div>
      </div>
      <BottomNav />
    </>
  );
}

export default Profile;
