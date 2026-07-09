export class Result {
  constructor({
    id = crypto.randomUUID(),
    examId,
    examTitle,
    studentId,
    studentName,
    answers,
    score,
    totalQuestions,
    percent,
    startedAt,
    submittedAt = new Date().toISOString(),
    durationSeconds = 0
  }) {
    this.id = id;
    this.examId = examId;
    this.examTitle = examTitle;
    this.studentId = studentId;
    this.studentName = studentName;
    this.answers = answers;
    this.score = score;
    this.totalQuestions = totalQuestions;
    this.percent = percent;
    this.startedAt = startedAt;
    this.submittedAt = submittedAt;
    this.durationSeconds = durationSeconds;
  }

  static from(data) {
    return new Result(data);
  }
}
