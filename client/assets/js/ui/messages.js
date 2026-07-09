import { escapeHtml } from "../utils/html.js";

export function showMessage(element, message, type = "info") {
  if (!element) {
    return;
  }

  element.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${escapeHtml(message)}
    </div>
  `;
}

export function clearMessage(element) {
  if (element) {
    element.innerHTML = "";
  }
}

export function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}
