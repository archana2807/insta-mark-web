// Small formatting helpers shared by server and client components.

export function telHref(phone) {
  return `tel:${String(phone).replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(number, text) {
  const digits = String(number).replace(/\D/g, "");
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

/**
 * Turns the client's "Applications" sentence into short tags:
 * "Hospitals, airports, and malls where X is required." → ["Hospitals", "Airports", "Malls"]
 * The full sentence is still shown verbatim next to the tags.
 */
export function toList(sentence) {
  return sentence
    .replace(/\.$/, "")
    .replace(/^suitable for\s+/i, "")
    .replace(/,?\s+(where|depending on|for identification|to support|complying with)\b.*$/i, "")
    .split(/,\s*/)
    .map((s) => s.replace(/^and\s+/i, "").trim())
    .filter((s) => s && !/^locations$/i.test(s)) // generic leftover once the clause is cut
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

// Admin display dates: India time zone, en-IN format.
const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

/**
 * @param {Date | string | null | undefined} date
 * @returns {string} formatted date and time, or "—"
 */
export function formatDateTime(date) {
  return date ? dateTime.format(new Date(date)) : "—";
}
