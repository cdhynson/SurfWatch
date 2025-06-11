import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import "./LoginSignup.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await axios.post(`${API_BASE}/login`, { email, password });
      localStorage.setItem("token", data.token);
      navigate("/profile");
    } catch (err) {
      setError("Login failed: Could not connect to server.");
    }
  };

  return (
    <>
      <TopNav />
      <div className="sign-container">
        <form onSubmit={handleLogin}>
          <h1>Welcome back!</h1>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder="Enter email address"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit">Login</button>
          <span>
            <p>Need an account?</p>
            <a className="signup-link" href="/signup">
              Sign up here!
            </a>
          </span>
          {error && (
            <p style={{ color: "red", marginTop: "1rem", fontWeight: "600" }}>
              {error}
            </p>
          )}
        </form>
      </div>
      <BottomNav />
    </>
  );
}

export default Login;
