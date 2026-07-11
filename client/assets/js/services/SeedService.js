import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";
import { User } from "../models/User.js";
import { StorageService } from "./StorageService.js";

const demoTeacherData = {
  id: "demo-teacher",
  fullName: "מורה הדגמה",
  nationalId: "111111111",
  email: "teacher@demo.com",
  password: "1234",
  role: "teacher"
};

const demoStudentData = {
  id: "demo-student",
  fullName: "סטודנט הדגמה",
  nationalId: "222222222",
  email: "student@demo.com",
  password: "1234",
  role: "student"
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function findMatchingUser(users, userData) {
  return users.find(user => (
    user.id === userData.id ||
    normalizeEmail(user.email) === normalizeEmail(userData.email) ||
    String(user.nationalId || "").trim() === userData.nationalId
  ));
}

function createDemoExam(teacherId) {
  return new Exam({
    id: "demo-js-exam",
    teacherId,
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
}

export class SeedService {
  constructor(storage = new StorageService()) {
    this.storage = storage;
  }

  initialize() {
    let users = this.storage.get("users", []);
    let usersChanged = false;
    let teacher = findMatchingUser(users, demoTeacherData);

    if (!teacher) {
      teacher = new User(demoTeacherData);
      users = [...users, teacher];
      usersChanged = true;
    }

    if (!findMatchingUser(users, demoStudentData)) {
      users = [...users, new User(demoStudentData)];
      usersChanged = true;
    }

    if (usersChanged) {
      this.storage.set("users", users);
    }

    const exams = this.storage.get("exams", []);
    const hasDemoExam = exams.some(exam => (
      exam.id === "demo-js-exam" ||
      String(exam.code || "").trim().toLowerCase() === "js-demo"
    ));

    if (!hasDemoExam && teacher.role === "teacher") {
      this.storage.set("exams", [...exams, createDemoExam(teacher.id)]);
    }

    if (this.storage.get("results", null) === null) {
      this.storage.set("results", []);
    }
  }
}
