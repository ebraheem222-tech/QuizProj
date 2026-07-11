import { StorageService } from "./StorageService.js";

export class ExamSessionService {
  constructor(storage = new StorageService()) {
    this.storage = storage;
    this.sessionsKey = "examSessions";
  }

  getAllSessions() {
    return this.storage.get(this.sessionsKey, []);
  }

  getSession(examId, studentId) {
    return this.getAllSessions().find(session => (
      session.examId === examId && session.studentId === studentId
    )) || null;
  }

  startOrResume({ exam, studentId, questionOrder }) {
    const existingSession = this.getSession(exam.id, studentId);

    if (existingSession && this.hasCurrentQuestions(existingSession, exam)) {
      return { session: existingSession, resumed: true };
    }

    if (existingSession) {
      this.finish(exam.id, studentId);
    }

    const startedAt = new Date();
    const durationMilliseconds = Math.max(0, Number(exam.durationMinutes) * 60 * 1000);
    const session = {
      examId: exam.id,
      studentId,
      startedAt: startedAt.toISOString(),
      expiresAt: durationMilliseconds > 0
        ? new Date(startedAt.getTime() + durationMilliseconds).toISOString()
        : null,
      questionOrder,
      selectedAnswers: {}
    };

    this.saveSession(session);
    return { session, resumed: false };
  }

  saveAnswer(examId, studentId, questionId, answerIndex) {
    const session = this.getSession(examId, studentId);

    if (!session) {
      return null;
    }

    const updatedSession = {
      ...session,
      selectedAnswers: {
        ...session.selectedAnswers,
        [questionId]: Number(answerIndex)
      }
    };

    this.saveSession(updatedSession);
    return updatedSession;
  }

  getRemainingSeconds(session, now = Date.now()) {
    if (!session?.expiresAt) {
      return null;
    }

    return Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - now) / 1000));
  }

  finish(examId, studentId) {
    this.storage.set(
      this.sessionsKey,
      this.getAllSessions().filter(session => (
        session.examId !== examId || session.studentId !== studentId
      ))
    );
  }

  saveSession(sessionToSave) {
    const sessions = this.getAllSessions();
    const exists = sessions.some(session => (
      session.examId === sessionToSave.examId && session.studentId === sessionToSave.studentId
    ));
    const nextSessions = exists
      ? sessions.map(session => (
        session.examId === sessionToSave.examId && session.studentId === sessionToSave.studentId
          ? sessionToSave
          : session
      ))
      : [...sessions, sessionToSave];

    this.storage.set(this.sessionsKey, nextSessions);
  }

  hasCurrentQuestions(session, exam) {
    const savedIds = [...session.questionOrder].sort();
    const currentIds = exam.questions.map(question => question.id).sort();

    return savedIds.length === currentIds.length &&
      savedIds.every((questionId, index) => questionId === currentIds[index]);
  }
}
