import { ExamService } from "../services/ExamService.js";
import { ResultService } from "../services/ResultService.js";
import { initializePage } from "../ui/layout.js";
import { BarChart } from "../ui/BarChart.js";
import { emptyState, showMessage } from "../ui/messages.js";
import { downloadTextFile } from "../utils/download.js";
import { escapeHtml, formatDate, formatPercent, getFormValues, toNumber } from "../utils/html.js";
import { pathFor } from "../utils/router.js";

const { currentUser } = initializePage({ activeRoute: "teacher", requireRole: "teacher" });
const examService = new ExamService();
const resultService = new ResultService();

const message = document.getElementById("teacherMessage");
const dashboard = document.getElementById("teacherDashboard");
const examForm = document.getElementById("examForm");
const examList = document.getElementById("teacherExamList");
const searchInput = document.getElementById("teacherSearchInput");
const scoreChart = new BarChart(document.getElementById("teacherScoreChart"), {
  ariaLabel: "ממוצע ציונים לפי מבחן",
  emptyText: "עדיין אין מבחנים להצגה בתרשים."
});

if (currentUser) {
  renderExamForm();
  renderTeacherPage();
}

function renderExamForm() {
  examForm.innerHTML = `
    <label class="form-field">
      שם המבחן
      <input class="form-control" name="title" required placeholder="לדוגמה: JavaScript Basics">
    </label>
    <label class="form-field">
      קטגוריה
      <input class="form-control" name="category" required placeholder="JavaScript / HTML / CSS">
    </label>
    <label class="form-field">
      קוד למציאת מבחן
      <input class="form-control" name="code" placeholder="אפשר להשאיר ריק ליצירה אוטומטית">
    </label>
    <label class="form-field">
      משך זמן בדקות
      <input class="form-control" name="durationMinutes" type="number" min="0" value="30">
    </label>
    <label class="form-field">
      תיאור
      <textarea class="form-control" name="description" rows="3" placeholder="מה נבדק במבחן"></textarea>
    </label>
    <label class="form-check d-flex gap-2 align-items-center">
      <input class="form-check-input" name="shuffleQuestions" type="checkbox">
      ערבוב סדר שאלות בזמן ביצוע
    </label>
    <button class="btn btn-primary" type="submit">שמירת מבחן</button>
    <label class="form-field">
      ייבוא מבחן JSON
      <input class="form-control" id="importExamFile" type="file" accept="application/json">
    </label>
  `;

  examForm.addEventListener("submit", handleCreateExam);
  document.getElementById("importExamFile").addEventListener("change", handleImportExam);
}

function handleCreateExam(event) {
  event.preventDefault();
  const values = getFormValues(examForm);

  try {
    const exam = examService.createExam({
      teacherId: currentUser.id,
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category.trim(),
      code: values.code.trim(),
      durationMinutes: toNumber(values.durationMinutes, 0),
      shuffleQuestions: examForm.elements.shuffleQuestions.checked
    });

    examForm.reset();
    showMessage(message, `המבחן "${exam.title}" נוצר. עכשיו אפשר להוסיף שאלות.`, "success");
    renderTeacherPage();
  } catch (error) {
    showMessage(message, error.message, "danger");
  }
}

async function handleImportExam(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const exam = examService.importExam(text, currentUser.id);
    showMessage(message, `המבחן "${exam.title}" יובא בהצלחה.`, "success");
    renderTeacherPage();
  } catch {
    showMessage(message, "קובץ ה-JSON אינו תקין.", "danger");
  } finally {
    event.target.value = "";
  }
}

function renderTeacherPage() {
  const exams = getFilteredTeacherExams();
  const allTeacherExams = examService.getExamsByTeacher(currentUser.id);
  const teacherExamIds = allTeacherExams.map(exam => exam.id);
  const teacherResults = resultService.getAllResults().filter(result => teacherExamIds.includes(result.examId));
  const average = teacherResults.length === 0
    ? 0
    : Math.round(teacherResults.reduce((sum, result) => sum + result.percent, 0) / teacherResults.length);

  dashboard.innerHTML = `
    <div class="stat-tile"><strong>${allTeacherExams.length}</strong><span>מבחנים</span></div>
    <div class="stat-tile"><strong>${allTeacherExams.reduce((sum, exam) => sum + exam.getQuestionCount(), 0)}</strong><span>שאלות</span></div>
    <div class="stat-tile"><strong>${teacherResults.length}</strong><span>הגשות</span></div>
    <div class="stat-tile"><strong>${formatPercent(average)}</strong><span>ממוצע ציונים</span></div>
  `;

  scoreChart.render(allTeacherExams.map(exam => {
    const results = resultService.getResultsByExam(exam.id);
    const examAverage = results.length === 0
      ? 0
      : Math.round(results.reduce((sum, result) => sum + result.percent, 0) / results.length);

    return {
      label: exam.title,
      value: examAverage,
      valueLabel: formatPercent(examAverage),
      meta: results.length === 1 ? "הגשה אחת" : `${results.length} הגשות`
    };
  }), { maxValue: 100 });

  renderExamList(exams);
}

function getFilteredTeacherExams() {
  const query = searchInput.value.trim();

  return examService
    .getExamsByTeacher(currentUser.id)
    .filter(exam => exam.hasSearchMatch(query))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function renderExamList(exams) {
  if (exams.length === 0) {
    examList.innerHTML = emptyState("לא נמצאו מבחנים למורה הזה.");
    return;
  }

  examList.innerHTML = exams.map(exam => {
    const resultsCount = resultService.getResultsByExam(exam.id).length;

    return `
      <article class="list-item">
        <div>
          <h3>${escapeHtml(exam.title)}</h3>
          <p class="meta-line">
            ID: ${escapeHtml(exam.id)} | קוד: ${escapeHtml(exam.code)} | קטגוריה: ${escapeHtml(exam.category)}
          </p>
          <p>${escapeHtml(exam.description || "אין תיאור")}</p>
          <p class="meta-line">
            שאלות: ${exam.getQuestionCount()} | הגשות: ${resultsCount} | עודכן: ${formatDate(exam.updatedAt)}
          </p>
        </div>
        <div class="item-actions">
          <a class="btn btn-primary btn-sm" href="${pathFor("examDetails", { id: exam.id })}">ניהול ועריכה</a>
          <button class="btn btn-outline-secondary btn-sm" data-action="export" data-id="${exam.id}" type="button">ייצוא JSON</button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${exam.id}" type="button">מחיקה</button>
        </div>
      </article>
    `;
  }).join("");
}

searchInput.addEventListener("input", renderTeacherPage);

examList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const examId = button.dataset.id;

  if (button.dataset.action === "export") {
    const exam = examService.getExamById(examId);
    downloadTextFile(`${exam.code}.json`, examService.exportExam(examId));
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm("למחוק את המבחן ואת תוצאותיו?");

    if (!confirmed) {
      return;
    }

    examService.deleteExam(examId);
    resultService.deleteResultsByExam(examId);
    showMessage(message, "המבחן נמחק.", "success");
    renderTeacherPage();
  }
});
