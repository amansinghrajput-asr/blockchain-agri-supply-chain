// Safe date parsing handling UTC strings from SQLite
export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  if (typeof dateStr === "string") {
    // If format is "YYYY-MM-DD HH:MM:SS" (SQLite default UTC), convert to ISO with Z
    if (!dateStr.includes("Z") && !dateStr.includes("+") && !dateStr.includes("T")) {
      return new Date(dateStr.replace(" ", "T") + "Z");
    }
  }
  return new Date(dateStr);
}

export function formatDateTime(dateStr, options = { dateStyle: "medium", timeStyle: "short" }) {
  try {
    return parseDate(dateStr).toLocaleString(undefined, options);
  } catch (e) {
    return dateStr;
  }
}

export function formatDate(dateStr, options = { day: "numeric", month: "short", year: "numeric" }) {
  try {
    return parseDate(dateStr).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateStr;
  }
}
