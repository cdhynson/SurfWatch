import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      <TopNav />
      <div className="settings-container">
        <h1>Settings</h1>
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </div>
      <BottomNav />
    </>
  );
}

export default Settings;
