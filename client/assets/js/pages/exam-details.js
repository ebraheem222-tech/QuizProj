import { Question } from "../models/Question.js";
import { AuthService } from "../services/AuthService.js";
import { ExamService } from "../services/ExamService.js";
import { ResultService } from "../services/ResultService.js";
import { initializePage } from "../ui/layout.js";
import { emptyState, showMessage } from "../ui/messages.js";
import { downloadTextFile } from "../utils/download.js";
import { escapeHtml, formatDate, formatPercent, getFormValues, toNumber } from "../utils/html.js";
import { getCurrentRouteId } from "../utils/router.js";

const { currentUser } = initializePage({ activeRoute: "teacher", requireRole: "teacher" });
const authService = new AuthService();
const examService = new ExamService();
const resultService = new ResultService();

const examId = getCurrentRouteId();
let exam = examService.getExamById(examId);
let editingQuestionId = null;

const title = document.getElementById("examDetailsTitle");
const message = document.getElementById("examDetailsMessage");
const detailsForm = document.getElementById("examDetailsForm");
const questionForm = document.getElementById("questionForm");
const questionsList = document.getElementById("questionsList");
const resultsTable = document.getElementById("examResultsTable");

if (currentUser) {
  if (!exam || exam.teacherId !== currentUser.id) {
    showMessage(message, "המבחן לא נמצא או שאינו שייך למורה המחובר.", "danger");
  } else {
    renderPage();
  }
}

function renderPage() {
  title.textContent = exam.title;
  renderDetailsForm();
  renderQuestionForm();
  renderQuestions();
  renderResults();
}

function renderDetailsForm() {
  detailsForm.innerHTML = `
    <label class="form-field">
      ID
      <input class="form-control" value="${escapeHtml(exam.id)}" readonly>
    </label>
    <label class="form-field">
      שם המבחן
      <input class="form-control" name="title" value="${escapeHtml(exam.title)}" required>
    </label>
    <label class="form-field">
      תיאור
      <textarea class="form-control" name="description" rows="3">${escapeHtml(exam.description)}</textarea>
    </label>
    <label class="form-field">
      קטגוריה
      <input class="form-control" name="category" value="${escapeHtml(exam.category)}" required>
    </label>
    <label class="form-field">
      קוד מבחן
      <input class="form-control" name="code" value="${escapeHtml(exam.code)}" required>
    </label>
    <label class="form-field">
      משך זמן בדקות
      <input class="form-control" name="durationMinutes" type="number" min="0" value="${exam.durationMinutes}">
    </label>
    <label class="form-check d-flex gap-2 align-items-center">
      <input class="form-check-input" name="shuffleQuestions" type="checkbox" ${exam.shuffleQuestions ? "checked" : ""}>
      ערבוב שאלות
    </label>
    <div class="item-actions">
      <button class="btn btn-primary" type="submit">שמירת פרטים</button>
      <button class="btn btn-outline-secondary" id="exportExamButton" type="button">ייצוא JSON</button>
    </div>
  `;
}

function renderQuestionForm(question = null) {
  const answers = question?.answers || ["", "", "", ""];

  questionForm.innerHTML = `
    <label class="form-field">
      טקסט שאלה
      <textarea class="form-control" name="text" rows="2" required>${escapeHtml(question?.text || "")}</textarea>
    </label>
    ${answers.map((answer, index) => `
      <label class="form-field">
        תשובה ${index + 1}
        <input class="form-control" name="answer${index}" value="${escapeHtml(answer)}" required>
      </label>
    `).join("")}
    <label class="form-field">
      תשובה נכונה
      <select class="form-select" name="correctAnswerIndex" required>
        ${answers.map((_, index) => `
          <option value="${index}" ${question?.correctAnswerIndex === index ? "selected" : ""}>תשובה ${index + 1}</option>
        `).join("")}
      </select>
    </label>
    <label class="form-field">
      רמת קושי
      <select class="form-select" name="difficulty">
        <option value="easy" ${question?.difficulty === "easy" ? "selected" : ""}>קל</option>
        <option value="medium" ${!question || question.difficulty === "medium" ? "selected" : ""}>בינוני</option>
        <option value="hard" ${question?.difficulty === "hard" ? "selected" : ""}>קשה</option>
      </select>
    </label>
    <div class="item-actions">
      <button class="btn btn-success" type="submit">${question ? "עדכון שאלה" : "הוספת שאלה"}</button>
      ${question ? '<button class="btn btn-outline-secondary" id="cancelQuestionEdit" type="button">ביטול עריכה</button>' : ""}
    </div>
  `;
}

detailsForm.addEventListener("submit", event => {
  event.preventDefault();
  const values = getFormValues(detailsForm);

  try {
    exam = examService.updateExam(exam.id, {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category.trim(),
      code: values.code.trim(),
      durationMinutes: toNumber(values.durationMinutes, 0),
      shuffleQuestions: detailsForm.elements.shuffleQuestions.checked
    });

    showMessage(message, "פרטי המבחן נשמרו.", "success");
    renderPage();
  } catch (error) {
    showMessage(message, error.message, "danger");
  }
});

detailsForm.addEventListener("click", event => {
  if (event.target.id === "exportExamButton") {
    downloadTextFile(`${exam.code}.json`, examService.exportExam(exam.id));
  }
});

questionForm.addEventListener("submit", event => {
  event.preventDefault();
  const values = getFormValues(questionForm);
  const question = new Question({
    text: values.text.trim(),
    answers: [values.answer0, values.answer1, values.answer2, values.answer3].map(answer => answer.trim()),
    correctAnswerIndex: toNumber(values.correctAnswerIndex, 0),
    difficulty: values.difficulty
  });

  if (question.answers.some(answer => !answer)) {
    showMessage(message, "יש למלא ארבע תשובות.", "danger");
    return;
  }

  if (editingQuestionId) {
    exam.updateQuestion(editingQuestionId, question);
    editingQuestionId = null;
    showMessage(message, "השאלה עודכנה.", "success");
  } else {
    exam.addQuestion(question);
    showMessage(message, "השאלה נוספה למבחן.", "success");
  }

  examService.saveExam(exam);
  exam = examService.getExamById(exam.id);
  renderQuestionForm();
  renderQuestions();
});

questionForm.addEventListener("click", event => {
  if (event.target.id === "cancelQuestionEdit") {
    editingQuestionId = null;
    renderQuestionForm();
  }
});

function renderQuestions() {
  if (exam.questions.length === 0) {
    questionsList.innerHTML = emptyState("עדיין אין שאלות במבחן.");
    return;
  }

  questionsList.innerHTML = exam.questions.map((question, index) => `
    <article class="list-item">
      <div>
        <h3>${index + 1}. ${escapeHtml(question.text)}</h3>
        <p class="meta-line">רמת קושי: ${escapeHtml(question.difficulty)}</p>
        <ol>
          ${question.answers.map((answer, answerIndex) => `
            <li class="${answerIndex === question.correctAnswerIndex ? "text-success fw-bold" : ""}">
              ${escapeHtml(answer)}
            </li>
          `).join("")}
        </ol>
      </div>
      <div class="item-actions">
        <button class="btn btn-outline-primary btn-sm" data-action="edit-question" data-id="${question.id}" type="button">עריכה</button>
        <button class="btn btn-outline-danger btn-sm" data-action="delete-question" data-id="${question.id}" type="button">מחיקה</button>
      </div>
    </article>
  `).join("");
}

questionsList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const questionId = button.dataset.id;

  if (button.dataset.action === "edit-question") {
    editingQuestionId = questionId;
    renderQuestionForm(exam.questions.find(question => question.id === questionId));
  }

  if (button.dataset.action === "delete-question") {
    exam.removeQuestion(questionId);
    examService.saveExam(exam);
    exam = examService.getExamById(exam.id);
    renderQuestions();
    showMessage(message, "השאלה נמחקה.", "success");
  }
});

function renderResults() {
  const results = resultService.getResultsByExam(exam.id);

  if (results.length === 0) {
    resultsTable.innerHTML = emptyState("עדיין אין תוצאות למבחן הזה.");
    return;
  }

  resultsTable.innerHTML = `
    <table class="table align-middle">
      <thead>
        <tr>
          <th>סטודנט</th>
          <th>תז</th>
          <th>ציון</th>
          <th>נכון</th>
          <th>הוגש</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(result => {
          const student = authService.getUserById(result.studentId);

          return `
            <tr>
              <td>${escapeHtml(result.studentName)}</td>
              <td>${escapeHtml(student?.nationalId || "-")}</td>
              <td>${formatPercent(result.percent)}</td>
              <td>${result.score}/${result.totalQuestions}</td>
              <td>${formatDate(result.submittedAt)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}
