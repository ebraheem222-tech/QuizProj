import { Result } from "../models/Result.js";
import { StorageService } from "./StorageService.js";

export class ResultService {
  constructor(storage = new StorageService()) {
    this.storage = storage;
    this.resultsKey = "results";
  }

  getAllResults() {
    return this.storage.get(this.resultsKey, []).map(result => Result.from(result));
  }

  saveAllResults(results) {
    this.storage.set(this.resultsKey, results);
  }

  getResultsByStudent(studentId) {
    return this.getAllResults()
      .filter(result => result.studentId === studentId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  getResultsByExam(examId) {
    return this.getAllResults()
      .filter(result => result.examId === examId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  deleteResultsByExam(examId) {
    this.saveAllResults(this.getAllResults().filter(result => result.examId !== examId));
  }

  saveResult(result) {
    const savedResult = Result.from(result);
    this.saveAllResults([...this.getAllResults(), savedResult]);
    return savedResult;
  }

  calculateResult({ exam, student, selectedAnswers, startedAt }) {
    const submittedAt = new Date().toISOString();

    // The saved answer snapshot lets teachers review what the student chose even if the exam changes later.
    const answers = exam.questions.map(question => {
      const answerIndex = selectedAnswers[question.id] ?? null;

      return {
        questionId: question.id,
        questionText: question.text,
        answerIndex,
        selectedAnswer: answerIndex === null ? "" : question.answers[answerIndex],
        correctAnswerIndex: question.correctAnswerIndex,
        correctAnswer: question.answers[question.correctAnswerIndex],
        isCorrect: answerIndex !== null && question.isCorrect(answerIndex)
      };
    });

    const score = answers.filter(answer => answer.isCorrect).length;
    const totalQuestions = exam.questions.length;
    const percent = totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100);
    const durationSeconds = Math.max(0, Math.round((new Date(submittedAt) - new Date(startedAt)) / 1000));

    return new Result({
      examId: exam.id,
      examTitle: exam.title,
      studentId: student.id,
      studentName: student.fullName,
      answers,
      score,
      totalQuestions,
      percent,
      startedAt,
      submittedAt,
      durationSeconds
    });
  }

  getStudentAverage(studentId) {
    const results = this.getResultsByStudent(studentId);

    if (results.length === 0) {
      return 0;
    }

    return Math.round(results.reduce((sum, result) => sum + result.percent, 0) / results.length);
  }
}
