import React from "react";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      {/* Check-In */}
      <section className="checkin-section">
        <h2>Check In</h2>
        <p>Let us know you're surfing today to get personalized stats!</p>
        <button className="checkin-button">I'm Surfing</button>
      </section>

      {/* Recommendations */}
      <section className="recommendations-section">
        <h2>Live Beach Recommendations</h2>
        <div className="carousel">
          {/* Replaced carousel with a real component later */}
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
            >
            </iframe>
          </div>
          <p>La Jolla Shores</p>
        </div>

          {/* Repeat for more beaches (will make function for this)*/}
        </div>
      </section>

      {/* Crowd Forecast Section */}
      <section className="forecast-section">
        <h2>Crowd Forecast</h2>
        <p>View projected crowd levels across popular beaches.</p>
        {/* Placeholder for future graph/map component */}
        <div className="forecast-placeholder">[Forecast Graph Here]</div>
      </section>
    </div>
  );
}

export default Home;
