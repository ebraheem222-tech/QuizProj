import { ExamService } from "../services/ExamService.js";
import { ResultService } from "../services/ResultService.js";
import { initializePage } from "../ui/layout.js";
import { BarChart } from "../ui/BarChart.js";
import { emptyState } from "../ui/messages.js";
import { escapeHtml, formatDate, formatPercent } from "../utils/html.js";
import { pathFor } from "../utils/router.js";

const { currentUser } = initializePage({ activeRoute: "student", requireRole: "student" });
const examService = new ExamService();
const resultService = new ResultService();

const dashboard = document.getElementById("studentDashboard");
const history = document.getElementById("studentHistory");
const scoreChart = new BarChart(document.getElementById("studentScoreChart"), {
  ariaLabel: "התקדמות ציוני הסטודנט",
  emptyText: "התרשים יוצג לאחר הגשת המבחן הראשון."
});

if (currentUser) {
  renderStudentPage();
}

function formatDuration(durationSeconds) {
  const seconds = Math.max(0, Number(durationSeconds) || 0);

  if (seconds < 60) {
    return `${seconds} שניות`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds === 0
    ? `${minutes} דקות`
    : `${minutes} דקות ${remainingSeconds} שניות`;
}

function renderStudentPage() {
  const results = resultService.getResultsByStudent(currentUser.id);
  const average = resultService.getStudentAverage(currentUser.id);
  const best = results.length === 0 ? 0 : Math.max(...results.map(result => result.percent));
  const lastSubmittedAt = results[0]?.submittedAt;

  dashboard.innerHTML = `
    <div class="stat-tile"><strong>${results.length}</strong><span>מבחנים שבוצעו</span></div>
    <div class="stat-tile"><strong>${formatPercent(average)}</strong><span>ממוצע ציונים</span></div>
    <div class="stat-tile"><strong>${formatPercent(best)}</strong><span>ציון גבוה</span></div>
    <div class="stat-tile"><strong>${lastSubmittedAt ? formatDate(lastSubmittedAt) : "-"}</strong><span>הגשה אחרונה</span></div>
  `;

  const latestResults = results.slice(0, 8).reverse();
  scoreChart.render(latestResults.map(result => ({
    label: result.examTitle,
    value: result.percent,
    valueLabel: formatPercent(result.percent),
    meta: formatDate(result.submittedAt)
  })), { maxValue: 100 });

  renderHistory(results);
}

function renderHistory(results) {
  if (results.length === 0) {
    history.innerHTML = emptyState("עדיין לא ביצעת מבחנים. אפשר להתחיל מחיפוש מבחן.");
    return;
  }

  history.innerHTML = `
    <table class="table align-middle">
      <thead>
        <tr>
          <th>מבחן</th>
          <th>ציון</th>
          <th>נכון</th>
          <th>משך</th>
          <th>תאריך</th>
          <th>פעולות</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(result => {
          const exam = examService.getExamById(result.examId);

          return `
            <tr>
              <td>${escapeHtml(result.examTitle)}</td>
              <td>${formatPercent(result.percent)}</td>
              <td>${result.score}/${result.totalQuestions}</td>
              <td>${formatDuration(result.durationSeconds)}</td>
              <td>${formatDate(result.submittedAt)}</td>
              <td>
                ${exam ? `<a class="btn btn-outline-primary btn-sm" href="${pathFor("takeExam", { id: exam.id })}">ביצוע חוזר</a>` : "-"}
              </td>
            </tr>
            <tr>
              <td colspan="6">
                <details>
                  <summary>צפייה בתשובות</summary>
                  <ul class="mt-2">
                    ${result.answers.map(answer => `
                      <li>
                        ${escapeHtml(answer.questionText)} -
                        הבחירה שלך: ${escapeHtml(answer.selectedAnswer || "לא נבחרה תשובה")} |
                        תשובה נכונה: ${escapeHtml(answer.correctAnswer)}
                      </li>
                    `).join("")}
                  </ul>
                </details>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}
