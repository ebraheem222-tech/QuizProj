import { escapeHtml } from "../utils/html.js";

export class BarChart {
  constructor(container, { ariaLabel = "תרשים", emptyText = "אין נתונים להצגה." } = {}) {
    this.container = container;
    this.ariaLabel = ariaLabel;
    this.emptyText = emptyText;
  }

  render(items, { maxValue = null } = {}) {
    if (!this.container) {
      return;
    }

    if (items.length === 0) {
      this.container.removeAttribute("role");
      this.container.removeAttribute("aria-label");
      this.container.innerHTML = `<p class="empty-state">${escapeHtml(this.emptyText)}</p>`;
      return;
    }

    const highestValue = maxValue ?? Math.max(1, ...items.map(item => Number(item.value) || 0));

    this.container.setAttribute("role", "list");
    this.container.setAttribute("aria-label", this.ariaLabel);
    this.container.innerHTML = items.map(item => {
      const value = Math.max(0, Number(item.value) || 0);
      const width = Math.min(100, Math.round((value / highestValue) * 100));
      const tone = this.getTone(value, highestValue);

      return `
        <div class="chart-row" role="listitem">
          <div class="chart-row-heading">
            <span class="chart-label">${escapeHtml(item.label)}</span>
            <strong class="chart-value">${escapeHtml(item.valueLabel ?? String(value))}</strong>
          </div>
          <div class="chart-track" aria-hidden="true">
            <span class="chart-fill chart-fill-${tone}" style="width: ${width}%"></span>
          </div>
          ${item.meta ? `<span class="chart-meta">${escapeHtml(item.meta)}</span>` : ""}
        </div>
      `;
    }).join("");
  }

  getTone(value, maxValue) {
    const ratio = maxValue === 0 ? 0 : value / maxValue;

    if (ratio >= 0.8) {
      return "high";
    }

    if (ratio >= 0.55) {
      return "medium";
    }

    return "low";
  }
}
