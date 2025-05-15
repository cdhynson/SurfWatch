import React, { useState } from 'react';
import TopNav from '../../components/Navbars/TopNav';
import BottomNav from '../../components/Navbars/BottomNav';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    location: '',
  });

  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        body: new URLSearchParams(formData),
        credentials: 'include', // Important for cookies
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else if (!response.ok) {
        const text = await response.text();
        setError("Email is taken, please try a different one");
      }
    } catch (err) {
      console.error(err);
      setError("Email is taken, please try a different one.");
    }
  };

  return (
    <>
    <TopNav/>
    <div className="sign-container">
      <form onSubmit={handleSubmit}>
        <h2>Welcome!</h2>
        {['username', 'email', 'password', 'location'].map((field) => (
          <div className="input-group" key={field}>
            <label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input
              type={field === 'email' ? 'email' : field === 'password' ? 'password' : 'text'}
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <button type="submit" className="btn">Sign Up</button>
        <span className="login-link">
       <p>Already have an account?</p> <a className="signup-link" href="/login">Login here</a>
      </span>
      {error && <p style={{ color: 'red', marginTop: '1rem', fontWeight: '600'}}>{error}</p>}
      </form>
      
    </div>
    <BottomNav/>
    </>
  );
};

export default Signup;
