function SessionModal() {
  return (
    <div className="session-modal">
      <form onSubmit={handleSession}>
        <h1>Add New Session</h1>
        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Surfed with Sharks"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="location">Location</label>
          <select
            id="location"
            name="location"
            placeholder="Select a spot"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="lower_trestles">Lower Trestles</option>
            <option value="scripps">Scripps</option>
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
          <label htmlFor="end">From</label>
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
          <select
            id="rating"
            name="rating"
            value={title}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="1">Lower Trestles</option>
            <option value="2">Scripps</option>
            <option value="3">Lower Trestles</option>
            <option value="4">Scripps</option>
            <option value="5">Scripps</option>
          </select>
        </div>
        <input type="submit" onSubmit={handleSession} />
      </form>
    </div>
  );
}


export default SessionModal;