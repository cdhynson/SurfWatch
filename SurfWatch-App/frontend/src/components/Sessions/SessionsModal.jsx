import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SessionModal.css"; // use same styles as add modal

export function EditSessionModal({ sessionId, initialData, token, API_BASE, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setLocation(initialData.location || "");
      setStartTime(initialData.start);
      setEndTime(initialData.end);
      setRating(initialData.rating || 0);
    }
  }, [initialData]);

  const handleUpdate = (e) => {
    e.preventDefault();

    axios.patch(
      `${API_BASE}/api/profile/session/${sessionId}`,
      {
        title,
        location,
        start: startTime,
        end: endTime,
        rating,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then(() => {
      onSuccess?.(); // optionally refresh session list
      onClose();
    })
    .catch(() => alert("Failed to update session"));
  };

  return (
    <div className="session-modal">
      <form onSubmit={handleUpdate}>
        <button type="button" className="close-modal" onClick={onClose}>
          x
        </button>
        <h1>Edit Session</h1>

        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="location">Location</label>
          <select
            id="location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="Lower Trestles">Lower Trestles</option>
            <option value="Scripps">Scripps</option>
            <option value="La Jolla">La Jolla</option>
            <option value="Del Mar">Del Mar</option>
            <option value="Blacks">Blacks</option>
            <option value="Cardiff">Cardiff</option>
          </select>
        </div>

        <div>
          <label htmlFor="start">From</label>
          <input
            type="datetime-local"
            id="start"
            name="start"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="end">To</label>
          <input
            type="datetime-local"
            id="end"
            name="end"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="rating">Rating</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= rating ? "star filled" : "star"}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <input type="submit" value="Update Session" />
      </form>
    </div>
  );
}
