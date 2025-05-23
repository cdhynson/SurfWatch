import React, { useState } from "react";
import BottomNav from "../../components/Navbars/BottomNav";
import TopNav from "../../components/Navbars/TopNav";
import { useNavigate } from "react-router-dom";

import "./LoginSignup.css"

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const response = await fetch("http://localhost:8000/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email,
        password,
      }),
    });

    if (response.redirected) {
      const redirectedTo = new URL(response.url);
      const parts = redirectedTo.pathname.split("/");
      const userEmail = parts[2];
      navigate(`/`); // Use navigate instead of window.location.href
    } else {
      const errorText = await response.text();
      setError("Login failed: Invalid credentials or server error.");
      console.error(errorText);
    }
  } catch (err) {
    console.error(err);
    setError("Login failed: Could not connect to server.");
  }
};


  return (
    <>
      <TopNav/>    
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
        <button type="submit">Login</button>
        <span>
          <p>Need an account?</p>
          <a className="signup-link" href="/signup">
          Sign up here!
        </a></span>
        {error && <p style={{ color: 'red', marginTop: '1rem', fontWeight: '600'}}>{error}</p>}
      </form>
    </div>
    <BottomNav/>
    </>
  );
}

export default Login;
