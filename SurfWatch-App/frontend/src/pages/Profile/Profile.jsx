import React, { useState, useCallback, useEffect } from "react";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import "./Profile.css";




function Profile() {
  const [activeTab, setActiveTab] = useState(0);

  const fetchSessions = useCallback(async () => {
    console.log("Clicked Sessions")
    return;
  },)

  const fetchSum = useCallback(async () => {
    console.log("Clicked Summary")
    return;
  },)

  useEffect(() => {
    if (activeTab === 1) {
      fetchSessions();
    }
    else{
      fetchSum();
    }
  }, [activeTab, fetchSessions, fetchSum]);

  return (
    <>
      <TopNav />
      <div className="profile-container">
        <div className="profile-header">
          <span id="surf-streak">
                <img src="/assets/fire.svg" alt="Flame Icon" />
                <p> 3 DAY SURFING STREAK</p>
          </span>

          <div className="pfp-section">
            <div className="pfp"/>
            <img src="/assets/pfp.svg" alt="Flame Icon" />
            <button className="edit-pfp"><img src="/assets/edit.svg" alt="Edit" /></button>
          </div>

          <h2 className="user-name">Jane Doe</h2>

          <div className="skill-container">
          <img src="/assets/intermediate.svg" alt="Skill Bar" />
            <p id="skill-label">INTERMEDIATE</p>
          </div>

          <button className="add-session-btn">Add Session</button>
        </div>
        
        <div className="tab-row">
          <span id="summary" onClick={() => setActiveTab(0)}>Summary</span>
          <span onClick={() => setActiveTab(1)} id="sessions">Sessions</span>
        </div>

        <div className="tab-content">

        </div>
      </div>
      <BottomNav />
    </>
  );
}

export default Profile;
