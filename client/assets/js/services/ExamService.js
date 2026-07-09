import { Exam } from "../models/Exam.js";
import { StorageService } from "./StorageService.js";

export class ExamService {
  constructor(storage = new StorageService()) {
    this.storage = storage;
    this.examsKey = "exams";
  }

  getAllExams() {
    return this.storage.get(this.examsKey, []).map(exam => Exam.from(exam));
  }

  saveAllExams(exams) {
    this.storage.set(this.examsKey, exams);
  }

  getExamById(examId) {
    return this.getAllExams().find(exam => exam.id === examId) || null;
  }

  getExamByCode(code) {
    return this.getAllExams().find(exam => exam.code.toLowerCase() === code.trim().toLowerCase()) || null;
  }

  getExamsByTeacher(teacherId) {
    return this.getAllExams().filter(exam => exam.teacherId === teacherId);
  }

  searchExams(query = "", category = "") {
    return this.getAllExams()
      .filter(exam => exam.getQuestionCount() > 0)
      .filter(exam => exam.hasSearchMatch(query))
      .filter(exam => !category || exam.category === category);
  }

  createExam(examData) {
    const exam = new Exam({
      ...examData,
      code: examData.code?.trim() || this.generateCode(examData.title)
    });

    this.saveAllExams([...this.getAllExams(), exam]);
    return exam;
  }

  updateExam(examId, updates) {
    let updatedExam = null;
    const exams = this.getAllExams().map(exam => {
      if (exam.id !== examId) {
        return exam;
      }

      updatedExam = Exam.from({
        ...exam,
        ...updates,
        id: exam.id,
        teacherId: exam.teacherId,
        questions: updates.questions ?? exam.questions,
        updatedAt: new Date().toISOString()
      });
      return updatedExam;
    });

    this.saveAllExams(exams);
    return updatedExam;
  }

  saveExam(examToSave) {
    const exam = Exam.from(examToSave);
    const exams = this.getAllExams();
    const exists = exams.some(item => item.id === exam.id);
    const nextExams = exists
      ? exams.map(item => (item.id === exam.id ? exam : item))
      : [...exams, exam];

    this.saveAllExams(nextExams);
    return exam;
  }

  deleteExam(examId) {
    this.saveAllExams(this.getAllExams().filter(exam => exam.id !== examId));
  }

  getCategories() {
    return [...new Set(this.getAllExams().map(exam => exam.category).filter(Boolean))].sort();
  }

  generateCode(title = "EXAM") {
    const prefix = title
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .slice(0, 4)
      .toUpperCase() || "EXAM";
    let code = "";

    do {
      code = `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    } while (this.getExamByCode(code));

    return code;
  }

  exportExam(examId) {
    const exam = this.getExamById(examId);

    if (!exam) {
      throw new Error("המבחן לא נמצא.");
    }

    return JSON.stringify(exam, null, 2);
  }

  importExam(jsonText, teacherId) {
    const data = JSON.parse(jsonText);
    const exam = new Exam({
      ...data,
      id: crypto.randomUUID(),
      teacherId,
      code: this.generateCode(data.title),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.saveAllExams([...this.getAllExams(), exam]);
    return exam;
  }
}
