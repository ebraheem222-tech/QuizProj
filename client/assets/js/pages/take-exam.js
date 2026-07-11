import { ExamService } from "../services/ExamService.js";
import { ExamSessionService } from "../services/ExamSessionService.js";
import { ResultService } from "../services/ResultService.js";
import { initializePage } from "../ui/layout.js";
import { showMessage } from "../ui/messages.js";
import { escapeHtml, formatPercent } from "../utils/html.js";
import { getCurrentRouteId, pathFor } from "../utils/router.js";

const { currentUser } = initializePage({ activeRoute: "search", requireRole: "student" });
const examService = new ExamService();
const examSessionService = new ExamSessionService();
const resultService = new ResultService();

const examId = getCurrentRouteId();
const exam = examService.getExamById(examId);
const title = document.getElementById("takeExamTitle");
const timerBox = document.getElementById("timerBox");
const timerValue = document.getElementById("timerValue");
const answeredCount = document.getElementById("answeredCount");
const progressTrack = document.getElementById("examProgressTrack");
const progressBar = document.getElementById("examProgressBar");
const message = document.getElementById("takeExamMessage");
const form = document.getElementById("takeExamForm");
const resultBox = document.getElementById("examResultBox");

let startedAt = new Date().toISOString();
let remainingSeconds = 0;
let timerId = null;
let submitted = false;
let displayQuestions = [];
let session = null;

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
  const initialQuestions = exam.shuffleQuestions ? shuffle([...exam.questions]) : [...exam.questions];
  const sessionState = examSessionService.startOrResume({
    exam,
    studentId: currentUser.id,
    questionOrder: initialQuestions.map(question => question.id)
  });

  session = sessionState.session;
  startedAt = session.startedAt;
  displayQuestions = orderQuestions(session.questionOrder);
  renderExamForm();
  restoreSavedAnswers();
  updateProgress();
  startTimer();

  if (sessionState.resumed && examSessionService.getRemainingSeconds(session) !== 0) {
    showMessage(message, "המשך המבחן נטען. התשובות והזמן נשמרו.", "info");
  }
}

function shuffle(items) {
  return items
    .map(item => ({ item, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(entry => entry.item);
}

function orderQuestions(questionOrder) {
  const questionsById = new Map(exam.questions.map(question => [question.id, question]));

  return questionOrder.map(questionId => questionsById.get(questionId)).filter(Boolean);
}

function getDifficultyKey(difficulty) {
  return ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";
}

function getDifficultyLabel(difficulty) {
  return {
    easy: "קל",
    medium: "בינוני",
    hard: "קשה"
  }[getDifficultyKey(difficulty)];
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
          <div class="question-meta-row">
            <span class="question-number">שאלה ${index + 1}</span>
            <span class="difficulty-badge difficulty-${getDifficultyKey(question.difficulty)}">
              ${getDifficultyLabel(question.difficulty)}
            </span>
          </div>
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
  remainingSeconds = examSessionService.getRemainingSeconds(session);

  if (remainingSeconds === null) {
    timerBox.classList.add("unlimited");
    timerValue.textContent = "ללא הגבלה";
    return;
  }

  renderTimer();

  if (remainingSeconds <= 0) {
    setTimeout(() => submitExam(true), 0);
    return;
  }

  timerId = setInterval(() => {
    remainingSeconds = examSessionService.getRemainingSeconds(session);
    renderTimer();

    if (remainingSeconds <= 0) {
      submitExam(true);
    }
  }, 1000);
}

function renderTimer() {
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const clock = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;

  timerValue.textContent = clock;
  timerBox.classList.toggle("warning", remainingSeconds > 60 && remainingSeconds <= 300);
  timerBox.classList.toggle("danger", remainingSeconds <= 60);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  submitExam(false);
});

form.addEventListener("change", event => {
  const answerInput = event.target.closest('input[type="radio"]');

  if (!answerInput || submitted) {
    return;
  }

  session = examSessionService.saveAnswer(
    exam.id,
    currentUser.id,
    answerInput.name,
    answerInput.value
  );
  updateProgress();
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

  if (isAutomatic) {
    showMessage(message, "הזמן הסתיים והמבחן הוגש אוטומטית.", "warning");
  }

  const result = resultService.calculateResult({
    exam,
    student: currentUser,
    selectedAnswers,
    startedAt
  });

  resultService.saveResult(result);
  examSessionService.finish(exam.id, currentUser.id);
  markAnswers(result);
  disableForm();
  renderResult(result, isAutomatic);
}

function collectSelectedAnswers() {
  const checkedInputs = [...form.querySelectorAll('input[type="radio"]:checked')];

  return checkedInputs.reduce((answers, input) => {
    answers[input.name] = Number(input.value);
    return answers;
  }, {});
}

function restoreSavedAnswers() {
  const answerInputs = [...form.querySelectorAll('input[type="radio"]')];

  Object.entries(session.selectedAnswers || {}).forEach(([questionId, answerIndex]) => {
    const input = answerInputs.find(item => (
      item.name === questionId && Number(item.value) === Number(answerIndex)
    ));

    if (input) {
      input.checked = true;
    }
  });
}

function updateProgress() {
  const answered = form.querySelectorAll('input[type="radio"]:checked').length;
  const total = exam.questions.length;
  const percent = total === 0 ? 0 : Math.round((answered / total) * 100);

  answeredCount.textContent = `${answered} מתוך ${total} נענו`;
  progressTrack.setAttribute("aria-valuemax", String(total));
  progressTrack.setAttribute("aria-valuenow", String(answered));
  progressBar.style.width = `${percent}%`;
}

function markAnswers(result) {
  const options = [...form.querySelectorAll(".answer-option")];

  result.answers.forEach(answer => {
    options
      .filter(option => option.dataset.questionId === answer.questionId)
      .forEach(option => {
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
  const unanswered = result.answers.filter(answer => answer.answerIndex === null).length;

  resultBox.innerHTML = `
    <section class="panel exam-result-panel" tabindex="-1">
      <h2>${isAutomatic ? "הזמן נגמר" : "תוצאה"}</h2>
      <p class="lead">ציון: ${result.score}/${result.totalQuestions} (${formatPercent(result.percent)})</p>
      <p>${isAutomatic ? "המבחן הוגש אוטומטית וכל התשובות שנבחרו נשמרו." : "המבחן נשמר בהיסטוריית הציונים שלך."}</p>
      ${unanswered > 0 ? `<p class="meta-line">שאלות ללא תשובה: ${unanswered}</p>` : ""}
      <div class="item-actions">
        <a class="btn btn-primary" href="${pathFor("student")}">דף סטודנט</a>
        <a class="btn btn-outline-primary" href="${pathFor("search")}">חיפוש מבחן נוסף</a>
      </div>
    </section>
  `;

  const resultPanel = resultBox.querySelector(".exam-result-panel");
  resultPanel.focus({ preventScroll: true });
  resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}
