import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import TopNav from "../../components/Navbars/TopNav";
import BottomNav from "../../components/Navbars/BottomNav";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");

  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;
;

  const handleSignup = async (e) => {
     e.preventDefault();
    try {
      await axios.post(`${API_BASE}/signup`, {
        username,
        email,
        password,
        location,
      });

      const loginRes = await axios.post(`${API_BASE}/login`, {
        email,
        password,
      });

      localStorage.setItem("token", loginRes.data.token); // Save token
      console.log("Succesful signup");
      navigate("/profile");
    } catch (err) {   
      console.log("Attempted to post to:", `${API_BASE}/signup`, {
        username,
        email,
        password,
        location,
      })  
      console.log("Error:",err);
      setError(err);
    }
  };

  

  return (
    <>
      <TopNav />
      <div className="sign-container">
        <form onSubmit={handleSignup}>
          <h2>Welcome!</h2>
          <div>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder="Enter email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter password "
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="location">Location:</label>
            <input
              type="location"
              id="location"
              name="location"
              placeholder="Ex: La Jolla, CA"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">
            Sign Up
          </button>
          <span className="login-link">
            <p>Already have an account?</p>{" "}
            <a className="signup-link" href="/login">
              Login here
            </a>
          </span>
          {error && (
            <p style={{ color: "red", marginTop: "1rem", fontWeight: "600" }}>
              {error.response?.data?.detail || error.message || "Signup failed"}
            </p>
          )}
        </form>
      </div>
      <BottomNav />
    </>
  );
}

export default Signup;


