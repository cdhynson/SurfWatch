import React, {useState}from "react";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";

import BottomSheet from "../../components/Forecast/ForecastSheet"

import "./Explore.css"

function Explore(){
  const [open, setOpen] = useState(false);
  const [beach, setBeach] = useState("Lower Trestles");
  const [temp, setTemp] = useState(60)

  return (<>
  <TopNav/>
  <div className="explore-container">
    <button onClick={() => setOpen(true)}>Open Bottom Sheet</button>
      <BottomSheet>
        <span className="sheet-header">
          <h2>{beach}</h2>
          <span>
              <img alt="weather condition"/>
              <p>{temp}</p>
          </span>
          <div className="foreast-graph">
            
          </div>
        </span>
        
        <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Voluptates numquam ad odio voluptate dolorum, ullam cum laborum sunt, officiis fugiat alias officia maiores temporibus repellendus nulla cumque dolore ab repellat!</p>
      </BottomSheet>
  </div>
  <BottomNav/>

  </>);
}

export default Explore;