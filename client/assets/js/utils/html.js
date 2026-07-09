export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatPercent(value) {
  if (Number.isNaN(Number(value))) {
    return "0%";
  }

  return `${Math.round(Number(value))}%`;
}

export function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
