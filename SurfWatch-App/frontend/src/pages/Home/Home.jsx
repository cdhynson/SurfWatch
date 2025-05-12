import React from "react";
import BottomNav from "../../components/Navbars/BottomNav";
import "./Home.css";


function Home() {

  function updateStreak(){

  }

  return (
    <>
      <div className="home-container">
        {/* Check-In */}
        <section className="checkin-section">
          <span id="surf-streak"><p>3 DAY SURFING STREAK!</p></span>
          <button className="checkin-button" onClick={updateStreak}>
            <h2>Check In</h2>
          </button>
        </section>
  
        {/* Recommendations */}
        <section className="recommendations-section">
          <h2>Recommended</h2>
          <div className="carousel">
            <div className="carousel-item">
              <img
                src="http://localhost:8000/video_feed"
                alt="sample-cam"
                className="camera-feed"
              />
              <p>Sample Cam</p>
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
              <p>La Jolla Shores</p>
            </div>
          </div>
        </section>
  
        {/* Crowd Forecast Section */}
        <section className="forecast-section">
          <h2>Crowd Forecast</h2>
          <p>View projected crowd levels across popular beaches.</p>
          <div className="forecast-placeholder">[Forecast Graph Here]</div>
        </section>
      </div>
      <BottomNav/>
    </>
  );
  
}

export default Home;
