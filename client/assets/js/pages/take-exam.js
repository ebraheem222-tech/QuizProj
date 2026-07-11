import { ExamService } from "../services/ExamService.js";
import { ResultService } from "../services/ResultService.js";
import { initializePage } from "../ui/layout.js";
import { showMessage } from "../ui/messages.js";
import { escapeHtml, formatPercent } from "../utils/html.js";
import { getCurrentRouteId, pathFor } from "../utils/router.js";

const { currentUser } = initializePage({ activeRoute: "search", requireRole: "student" });
const examService = new ExamService();
const resultService = new ResultService();

const examId = getCurrentRouteId();
const exam = examService.getExamById(examId);
const title = document.getElementById("takeExamTitle");
const timerBox = document.getElementById("timerBox");
const message = document.getElementById("takeExamMessage");
const form = document.getElementById("takeExamForm");
const resultBox = document.getElementById("examResultBox");

let startedAt = new Date().toISOString();
let remainingSeconds = 0;
let timerId = null;
let submitted = false;
let displayQuestions = [];

if (currentUser) {
  if (!exam) {
    showMessage(message, "המבחן לא נמצא.", "danger");
  } else if (exam.getQuestionCount() === 0) {
    showMessage(message, "המבחן עדיין לא כולל שאלות.", "warning");
  } else {
    startExam();
  }
}

function startExam() {
  title.textContent = exam.title;
  displayQuestions = exam.shuffleQuestions ? shuffle([...exam.questions]) : [...exam.questions];
  renderExamForm();
  startTimer();
}

function shuffle(items) {
  return items
    .map(item => ({ item, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(entry => entry.item);
}

function renderExamForm() {
  form.innerHTML = `
    <section class="panel exam-summary">
      <p class="exam-description">${escapeHtml(exam.description || "אין תיאור למבחן.")}</p>
      <div class="exam-meta">
        <span><strong>קטגוריה:</strong> ${escapeHtml(exam.category)}</span>
        <span><strong>קוד:</strong> ${escapeHtml(exam.code)}</span>
        <span><strong>זמן:</strong> ${exam.durationMinutes ? `${exam.durationMinutes} דקות` : "ללא הגבלה"}</span>
      </div>
    </section>
    ${displayQuestions.map((question, index) => `
      <section
        class="question-box"
        data-question-id="${question.id}"
        role="group"
        aria-labelledby="question-title-${index}"
      >
        <header class="question-header">
          <span class="question-number">שאלה ${index + 1}</span>
          <h2 class="question-title" id="question-title-${index}">${escapeHtml(question.text)}</h2>
        </header>
        <div class="answer-list">
          ${question.answers.map((answer, answerIndex) => `
            <label class="answer-option" data-question-id="${question.id}" data-answer-index="${answerIndex}">
              <input type="radio" name="${question.id}" value="${answerIndex}">
              <span>${escapeHtml(answer)}</span>
            </label>
          `).join("")}
        </div>
      </section>
    `).join("")}
    <button class="btn btn-primary exam-submit-button" id="submitExamButton" type="submit">סיום ושליחת מבחן</button>
  `;
}

function startTimer() {
  remainingSeconds = Math.max(0, Number(exam.durationMinutes) * 60);

  if (remainingSeconds === 0) {
    timerBox.textContent = "ללא הגבלת זמן";
    return;
  }

  renderTimer();
  timerId = setInterval(() => {
    remainingSeconds -= 1;
    renderTimer();

    if (remainingSeconds <= 0) {
      submitExam(true);
    }
  }, 1000);
}

function renderTimer() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timerBox.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  submitExam(false);
});

function submitExam(isAutomatic) {
  if (submitted) {
    return;
  }

  const selectedAnswers = collectSelectedAnswers();
  const missingAnswers = exam.questions.filter(question => selectedAnswers[question.id] === undefined);

  if (!isAutomatic && missingAnswers.length > 0) {
    const confirmed = confirm("לא ענית על כל השאלות. לשלוח בכל זאת?");

    if (!confirmed) {
      return;
    }
  }

  submitted = true;
  clearInterval(timerId);

  const result = resultService.calculateResult({
    exam,
    student: currentUser,
    selectedAnswers,
    startedAt
  });

  resultService.saveResult(result);
  markAnswers(result);
  disableForm();
  renderResult(result, isAutomatic);
}

function collectSelectedAnswers() {
  return exam.questions.reduce((answers, question) => {
    const selected = form.querySelector(`input[name="${question.id}"]:checked`);

    if (selected) {
      answers[question.id] = Number(selected.value);
    }

    return answers;
  }, {});
}

function markAnswers(result) {
  result.answers.forEach(answer => {
    form.querySelectorAll(`[data-question-id="${answer.questionId}"] .answer-option`).forEach(option => {
      const optionIndex = Number(option.dataset.answerIndex);

      if (optionIndex === answer.correctAnswerIndex) {
        option.classList.add("correct");
      }

      if (optionIndex === answer.answerIndex && !answer.isCorrect) {
        option.classList.add("wrong");
      }
    });
  });
}

function disableForm() {
  form.querySelectorAll("input, button").forEach(element => {
    element.disabled = true;
  });
}

function renderResult(result, isAutomatic) {
  resultBox.innerHTML = `
    <section class="panel">
      <h2>${isAutomatic ? "הזמן נגמר" : "תוצאה"}</h2>
      <p class="lead">ציון: ${result.score}/${result.totalQuestions} (${formatPercent(result.percent)})</p>
      <div class="item-actions">
        <a class="btn btn-primary" href="${pathFor("student")}">דף סטודנט</a>
        <a class="btn btn-outline-primary" href="${pathFor("search")}">חיפוש מבחן נוסף</a>
      </div>
    </section>
  `;
}
