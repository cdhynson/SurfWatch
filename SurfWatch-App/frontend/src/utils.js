// utils.js

export function localDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function degreesToCompass(deg) {
  if (typeof deg !== 'number' || isNaN(deg)) return "Unknown";

  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];

  // Normalize degrees to 0–360 range
  const normalized = ((deg % 360) + 360) % 360;

  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}


export function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 19).replace("T", " "); // "YYYY-MM-DDTHH:MM"
}


export function computeSurfStreak(sessions) {
  if (!sessions.length) return 0;

  const dates = sessions.map((s) => localDateString(s.start));
  const uniqueDates = [...new Set(dates)].sort((a, b) => (a < b ? 1 : -1));

  let streak = 0;
  let currentDate = new Date(uniqueDates[0]);
  currentDate.setHours(0, 0, 0, 0);

  for (const sessionDateStr of uniqueDates) {
    const sessionDate = new Date(sessionDateStr);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (sessionDate < currentDate) {
      break;
    } else {
      continue;
    }
  }
  return streak;
}
