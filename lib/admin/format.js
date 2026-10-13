// Display helpers for the admin panel (India time zone, en-IN format).

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function formatDateTime(date) {
  return date ? dateTime.format(new Date(date)) : "—";
}
