import { Question } from "./Question.js";

export class Exam {
  constructor({
    id = crypto.randomUUID(),
    teacherId,
    title,
    description = "",
    category = "",
    code,
    durationMinutes = 30,
    shuffleQuestions = false,
    questions = [],
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.teacherId = teacherId;
    this.title = title;
    this.description = description;
    this.category = category;
    this.code = code;
    this.durationMinutes = Number(durationMinutes) || 0;
    this.shuffleQuestions = Boolean(shuffleQuestions);
    this.questions = questions.map(question => Question.from(question));
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static from(data) {
    return new Exam(data);
  }

  touch() {
    this.updatedAt = new Date().toISOString();
  }

  addQuestion(questionData) {
    this.questions.push(Question.from(questionData));
    this.touch();
  }

  updateQuestion(questionId, questionData) {
    this.questions = this.questions.map(question => (
      question.id === questionId
        ? Question.from({ ...question, ...questionData, id: question.id })
        : question
    ));
    this.touch();
  }

  removeQuestion(questionId) {
    this.questions = this.questions.filter(question => question.id !== questionId);
    this.touch();
  }

  getQuestionCount() {
    return this.questions.length;
  }

  hasSearchMatch(query) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return true;
    }

    return [this.title, this.description, this.category, this.code]
      .some(value => String(value || "").toLowerCase().includes(normalized));
  }
}
