import React from "react";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";

import "./Home.css";


function Home() {

  function startSession() {
    
  return (
    <div className="session-modal">
      <form>

      </form>
    </div>
  )

  }

  function endSession() {

  }

  return (
    <>
    <TopNav/>
      <div className="home-container">
        {/* Check-In */}
        <section className="checkin-section">
          <span id="surf-streak">
            <img src="/assets/fire.svg" alt="Flame Icon" />
            <p> 3 DAY SURFING STREAK</p></span>
          <button className="checkin-button" onClick={startSession}>
            <h2>Start Session</h2>
          </button>
        </section>
  
        {/* Recommendations */}
        <section className="recommendations-section">
          <h2>Recommended</h2>
          <div className="carousel">
            <div className="carousel-item">
              <img
                src="https://6f90-69-196-44-113.ngrok-free.app/video_feed"
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
          <div className="forecast-placeholder">[Forecast Graph Here]</div>
        </section>
      </div>
      <BottomNav/>
    </>
  );
  
}

export default Home;
