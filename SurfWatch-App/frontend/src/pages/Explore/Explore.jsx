import React from "react";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";

import ForecastSheet from "../../components/Forecast/ForecastSheet"

import "./Explore.css"

function Explore(){

  return (<>
  <TopNav/>
  <div className="explore-container">
    <ForecastSheet/>
  </div>
  <BottomNav/>

  </>);
}

export default Explore;