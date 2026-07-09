export class Question {
  constructor({
    id = crypto.randomUUID(),
    text,
    answers,
    correctAnswerIndex,
    difficulty = "medium"
  }) {
    this.id = id;
    this.text = text;
    this.answers = answers;
    this.correctAnswerIndex = Number(correctAnswerIndex);
    this.difficulty = difficulty;
  }

  static from(data) {
    return new Question(data);
  }

  isCorrect(userAnswerIndex) {
    return Number(userAnswerIndex) === this.correctAnswerIndex;
  }
}
