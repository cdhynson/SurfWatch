import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "./BeachCam.css";

function BeachCam({name, beach, url}){
  const API_BASE = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [lowestTime, setLowestTime] = useState("");
  const [peakTime, setPeakTime] = useState("")
  

  useEffect(() => {
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    axios
      .get(`${API_BASE}/api/crowd/daily`, {
        params: {
          beach_index: beach,
          start_date: formatDate(new Date()),
          end_date: formatDate(new Date()),
        },
      })
      .then((res) => {
        setLowestTime(res.data[0].low_time);
        setPeakTime(res.data[0].peak_time);
        console.log("lowest time:", lowestTime)
      })
      .catch((error) => {
        console.error("Error fetching forecast:", error);
      });
  }, [beach, API_BASE, lowestTime]);

  const handleClick = ()=>{
    navigate("/explore",{
      state:{
        beachID: beach,
        beachName: name,
        beachURL: url,
      }
    })
  }

  return (
      <div className="beachcam-container">
        <div className="carousel-item">
          <video src={url} autoPlay loop muted playsInline ></video>
          <div className="beachcam-label" onClick={handleClick}>
            <h3>{name}</h3>
            <span className="beach-crowds">
              <p>Lowest Crowds: {lowestTime}</p>
              <p>Peak Crowds: {peakTime}</p>
            </span>
          </div>
        </div>
      </div>
  );
}

export default BeachCam;