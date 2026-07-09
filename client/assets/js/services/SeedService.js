import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";
import { User } from "../models/User.js";
import { StorageService } from "./StorageService.js";

export class SeedService {
  constructor(storage = new StorageService()) {
    this.storage = storage;
  }

  initialize() {
    const users = this.storage.get("users", []);

    if (users.length > 0) {
      return;
    }

    const teacher = new User({
      id: "demo-teacher",
      fullName: "מורה הדגמה",
      nationalId: "111111111",
      email: "teacher@demo.com",
      password: "1234",
      role: "teacher"
    });

    const student = new User({
      id: "demo-student",
      fullName: "סטודנט הדגמה",
      nationalId: "222222222",
      email: "student@demo.com",
      password: "1234",
      role: "student"
    });

    const exam = new Exam({
      id: "demo-js-exam",
      teacherId: teacher.id,
      title: "JavaScript Basics",
      description: "מבחן הדגמה קצר על JavaScript בצד לקוח.",
      category: "JavaScript",
      code: "JS-DEMO",
      durationMinutes: 15,
      shuffleQuestions: true,
      questions: [
        new Question({
          text: "מהי המטרה של localStorage?",
          answers: [
            "שמירת נתונים בדפדפן",
            "שליחת אימיילים",
            "יצירת בסיס נתונים בשרת",
            "עיצוב CSS"
          ],
          correctAnswerIndex: 0,
          difficulty: "easy"
        }),
        new Question({
          text: "איזו מילת מפתח מייבאת קוד מ-ES Module?",
          answers: ["include", "require", "import", "load"],
          correctAnswerIndex: 2,
          difficulty: "easy"
        })
      ]
    });

    this.storage.set("users", [teacher, student]);
    this.storage.set("exams", [exam]);
    this.storage.set("results", []);
  }
}
