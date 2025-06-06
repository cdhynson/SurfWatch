// utils.js

export function localDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
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
