import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SessionModal.css";

const BEACH_OPTIONS = [
  "Lower Trestles",
  "Scripps",
  "La Jolla",
  "Del Mar",
  "Blacks",
  "Cardiff",
];

export function EditSessionModal({ sessionId, initialData, token, API_BASE, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setLocation(initialData.location || BEACH_OPTIONS[0]);
      setStartTime(initialData.start || "");
      setEndTime(initialData.end || "");
      setRating(initialData.rating || 0);
    }
  }, [initialData]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(
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
      );
      onSuccess?.();
      onClose();
    } catch {
      alert("Failed to update session");
    }
  };

  return (
    <div className="session-modal">
      <form onSubmit={handleUpdate}>
        <button type="button" className="close-modal" onClick={onClose}>
          ×
        </button>
        <h1>Edit Session</h1>

        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="location">Location</label>
          <select
            id="location"
            name="location"
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
          >
            {BEACH_OPTIONS.map((beach) => (
              <option key={beach} value={beach}>
                {beach}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start">From</label>
          <input
            type="datetime-local"
            id="start"
            name="start"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="end">To</label>
          <input
            type="datetime-local"
            id="end"
            name="end"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
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
                role="button"
                tabIndex={0}
                aria-label={`Set rating to ${star}`}
                onKeyPress={e => {
                  if (e.key === "Enter" || e.key === " ") setRating(star);
                }}
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
