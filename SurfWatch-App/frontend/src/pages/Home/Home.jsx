import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import ForecastChart  from "../../components/Forecast/ForecastChart.jsx";
import { computeSurfStreak } from "../../utils.js";


import "./Home.css";


function Home() {

  const [activeTab, setActiveTab] = useState(0); // 0 = Summary, 1 = Sessions
  const [showModal, setShowModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rating, setRating] = useState(0);

  const [username, setUsername] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/profile/session`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSessions(res.data);
        setLoggedIn(true)
      })
      .catch(() => setLoggedIn(false));

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


  const handleStart = (e) => {
    e.preventDefault();
    axios
      .post(
        `${API_BASE}/api/profile/session`,
        {
          start: startTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      )
      .catch(() => alert("Failed to start session:"));
  };

  function startSession() {
    

  }

  function endSession() {

  }

  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.start) - new Date(a.start));
  }, [sessions]);
  
  const streak = React.useMemo(() => computeSurfStreak(sortedSessions), [sortedSessions]);
  
  console.log("Sessions:", sessions);
  console.log("Streak:", streak);
  
  const beaches = [
    {name:"Lower Trestles", value:"lowerTrestles"},{name:"Scripps", value: "scripps"},
    {name:"Del Mar", value: "delMar"}];
  
  const allDays = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
  const days = [...allDays.slice(todayIndex), ...allDays.slice(0, todayIndex)];


  return (
    <>
    <TopNav/>
      <div className="home-container">
        {/* Check-In */}
        <section className="checkin-section">
          <span id="surf-streak" style={{ opacity: streak === 0 ? 0.5 : 1 , display: !loggedIn ? "none" : "flex"}}>
          <img src="/assets/fire.svg" alt="Flame Icon" />
          <p>{streak} DAY SURFING STREAK</p>
        </span>
          {!loggedIn ? (
            <button className="checkin-button" onClick={() => navigate("/login")} style={{background:"#29324179"}}>
              <h2>Login to start session</h2>
            </button>
          ) : (
            <button className="checkin-button" onClick={startSession}>
              <h2>Start Session</h2>
            </button>
          )}

        </section>
  
        {/* Recommendations */}
        <section className="recommendations-section">
          <h2>Recommended</h2>
          <div className="carousel">
            <div className="carousel-item">
              <img
                src="https://9e0cfe0e91bd.ngrok.app/video_feed"
                width="640"
                height="480"
              />
              <p className="location">Sample Cam</p>
            </div>
            <div className="carousel-item">
              <div className="iframe-wrapper">
                <iframe
                  src="https://embed.cdn-surfline.com/cams/58349b9b3421b20545c4b54d/199ae31e65bf748a7c7d928332998440490cd979"
                  frameBorder="0"
                  height="220vh"
                  allowFullScreen
                  title="La Jolla Shores Cam"
                ></iframe>
              </div>
              <p className="location">La Jolla Shores</p>
            </div>
          </div>
        </section>
  
        {/* Crowd Forecast Section */}
        <section className="forecast-section">
          <h2>Crowd Forecast</h2>
            <span className="forecast-days"> 
              {days.map((d, i) => (
                <p key={`label-${i}`} >
                  {d}
                </p>
              ))}
            </span>
          {beaches.map((beach, idx)=>(
            <ForecastChart 
              name = {beach.name} 
              beach ={beach.value} 
              timeUnit={"days"}/>
          ))}
          
        </section>
      </div>
      <BottomNav/>
    </>
  );
  
}

export default Home;
