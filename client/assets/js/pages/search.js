import { ExamService } from "../services/ExamService.js";
import { initializePage } from "../ui/layout.js";
import { emptyState } from "../ui/messages.js";
import { escapeHtml } from "../utils/html.js";
import { pathFor } from "../utils/router.js";

const { currentUser } = initializePage({ activeRoute: "search", requireRole: "student" });
const examService = new ExamService();

const form = document.getElementById("searchForm");
const results = document.getElementById("searchResults");

if (currentUser) {
  renderSearchForm();
  renderResults();
}

function renderSearchForm() {
  const categories = examService.getCategories();

  form.innerHTML = `
    <input class="form-control" name="query" placeholder="שם מבחן או קוד מבחן">
    <select class="form-select" name="category">
      <option value="">כל הקטגוריות</option>
      ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
    </select>
    <button class="btn btn-primary" type="submit">חיפוש</button>
  `;
}

function renderResults() {
  const values = Object.fromEntries(new FormData(form).entries());
  const exams = examService.searchExams(values.query || "", values.category || "");

  if (exams.length === 0) {
    results.innerHTML = emptyState("לא נמצאו מבחנים זמינים.");
    return;
  }

  results.innerHTML = exams.map(exam => `
    <article class="list-item">
      <div>
        <h3>${escapeHtml(exam.title)}</h3>
        <p>${escapeHtml(exam.description || "אין תיאור")}</p>
        <p class="meta-line">
          קוד: ${escapeHtml(exam.code)} | קטגוריה: ${escapeHtml(exam.category)} |
          שאלות: ${exam.getQuestionCount()} | זמן: ${exam.durationMinutes} דקות
        </p>
      </div>
      <div class="item-actions">
        <a class="btn btn-primary btn-sm" href="${pathFor("takeExam", { id: exam.id })}">ביצוע מבחן</a>
      </div>
    </article>
  `).join("");
}

form.addEventListener("submit", event => {
  event.preventDefault();
  renderResults();
});

form.addEventListener("input", renderResults);
