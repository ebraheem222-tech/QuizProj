# מסמך טכני - QuizProj

## 1. פרטי הפרויקט וקישורים

**שם הפרויקט:** QuizProj - מערכת מבחנים צד לקוח

**טכנולוגיות:** HTML, CSS, JavaScript, ES Modules, OOP, JSON, `localStorage`, Node.js ו-Express.

- קוד מקור ב-GitHub: <https://github.com/ebraheem222-tech/QuizProj>
- אתר GitHub Pages: <https://ebraheem222-tech.github.io/QuizProj/>
- כתובת בהרצה מקומית: <http://localhost:3000>

המערכת שומרת את המידע בדפדפן בלבד. שרת Express אינו שומר מידע ואינו כולל בסיס נתונים; תפקידו להגיש את תיקיית `client/` כאתר סטטי ולספק כתובות URL נקיות.

### הרצה מקומית

```bash
npm install
npm start
```

לאחר מכן פותחים בדפדפן את <http://localhost:3000>. אין לפתוח את הקבצים ישירות באמצעות `file://`, מפני ש-ES Modules ונתיבים כגון `/register` דורשים שרת HTTP.

### פיצ'רים ממומשים

- טיימר שנשמר גם לאחר רענון הדף, שמירה אוטומטית של תשובות, אזהרת יציאה והגשה אוטומטית בסיום הזמן.
- שאלות ללא תשובה מסומנות באדום; אישור יציאה מסיים את המבחן, שומר את התשובות ומציג תוצאה.
- רמות קושי לשאלות, קטגוריות, חיפוש וסינון מבחנים וערבוב סדר שאלות.
- היסטוריית ציונים, ממוצע וציון גבוה, הצגת תשובות נכונות ודשבורד עם תרשימי ציונים.
- מצב כהה, ייבוא וייצוא מבחן כ-JSON וניווט מותאם לתפקיד המשתמש.

---

## 2. דפי האתר והניווט ביניהם

| דף | נתיב Express מקומי | נתיב סטטי ב-GitHub Pages | הרשאה | תפקיד הדף |
|---|---|---|---|---|
| דף ראשי | `/` | `/QuizProj/client/index.html` | כולם | הצגת הפרויקט וקישורים להרשמה ולהתחברות |
| הרשמה | `/register` | `/QuizProj/client/pages/register.html` | אורח | יצירת משתמש מסוג מורה או סטודנט |
| התחברות | `/login` | `/QuizProj/client/pages/login.html` | אורח | התחברות באמצעות אימייל או תעודת זהות |
| דף מורה | `/teacher` | `/QuizProj/client/pages/teacher.html` | מורה | יצירה, חיפוש, מחיקה, ייבוא וייצוא של מבחנים |
| פרטי מבחן | `/exam/:id` | `/QuizProj/client/pages/exam-details.html?id=:id` | מורה בעל המבחן | עריכת מבחן, ניהול שאלות וצפייה בתוצאות |
| דף סטודנט | `/student` | `/QuizProj/client/pages/student.html` | סטודנט | היסטוריית מבחנים, ציונים וממוצע |
| חיפוש מבחן | `/search` | `/QuizProj/client/pages/search.html` | סטודנט | חיפוש לפי שם, תיאור, קטגוריה או קוד |
| ביצוע מבחן | `/take/:id` | `/QuizProj/client/pages/take-exam.html?id=:id` | סטודנט | מענה על שאלות, טיימר ושליחת התוצאה |

המודול `router.js` יוצר את הכתובת המתאימה לסביבת ההרצה. בהרצה עם Node הוא מחזיר נתיב נקי, לדוגמה `/exam/123`. ב-GitHub Pages הוא מחזיר נתיב לקובץ HTML עם מזהה ב-query string, לדוגמה `exam-details.html?id=123`.

---

## 3. פורמט הנתונים הנשמרים כ-JSON

המחלקה `StorageService` מוסיפה את התחילית `quizproj.` לכל מפתח, ממירה אובייקטים ל-JSON באמצעות `JSON.stringify`, וקוראת אותם באמצעות `JSON.parse`.

| מפתח ב-`localStorage` | סוג הערך | תוכן |
|---|---|---|
| `quizproj.users` | מערך | משתמשים רשומים |
| `quizproj.currentUserId` | מחרוזת | מזהה המשתמש המחובר |
| `quizproj.exams` | מערך | מבחנים והשאלות שבתוכם |
| `quizproj.results` | מערך | ניסיונות וציוני תלמידים |
| `quizproj.examSessions` | מערך | זמן, סדר שאלות ותשובות של מבחנים שעדיין לא הוגשו |
| `quizproj.theme` | מחרוזת | ערך `light` או `dark` |

### משתמש (`User`)

```json
{
  "id": "demo-student",
  "fullName": "סטודנט הדגמה",
  "nationalId": "222222222",
  "email": "student@demo.com",
  "password": "1234",
  "role": "student",
  "createdAt": "2026-07-10T00:00:00.000Z"
}
```

- `role` יכול להיות `teacher` או `student`.
- `id` נוצר באמצעות `crypto.randomUUID()`.
- בפרויקט לימודי זה הסיסמה נשמרת כטקסט רגיל. במערכת אמיתית יש לבצע אימות בצד שרת ולשמור hash בלבד.

### מבחן (`Exam`) ושאלה (`Question`)

```json
{
  "id": "demo-js-exam",
  "teacherId": "demo-teacher",
  "title": "JavaScript Basics",
  "description": "מבחן הדגמה קצר",
  "category": "JavaScript",
  "code": "JS-DEMO",
  "durationMinutes": 15,
  "shuffleQuestions": true,
  "questions": [
    {
      "id": "question-id",
      "text": "מהי המטרה של localStorage?",
      "answers": [
        "שמירת נתונים בדפדפן",
        "שליחת אימיילים",
        "הרצת שרת",
        "עיצוב CSS"
      ],
      "correctAnswerIndex": 0,
      "difficulty": "easy"
    }
  ],
  "createdAt": "2026-07-10T00:00:00.000Z",
  "updatedAt": "2026-07-10T00:00:00.000Z"
}
```

- `teacherId` מקשר את המבחן למורה שיצר אותו.
- `code` הוא קוד חיפוש ייחודי למבחן.
- `correctAnswerIndex` הוא מיקום התשובה הנכונה במערך `answers`, החל מ-0.
- `difficulty` יכול להיות `easy`, `medium` או `hard`.

### תוצאה (`Result`)

```json
{
  "id": "result-id",
  "examId": "demo-js-exam",
  "examTitle": "JavaScript Basics",
  "studentId": "demo-student",
  "studentName": "סטודנט הדגמה",
  "answers": [
    {
      "questionId": "question-id",
      "questionText": "מהי המטרה של localStorage?",
      "answerIndex": 0,
      "selectedAnswer": "שמירת נתונים בדפדפן",
      "correctAnswerIndex": 0,
      "correctAnswer": "שמירת נתונים בדפדפן",
      "isCorrect": true
    }
  ],
  "score": 1,
  "totalQuestions": 1,
  "percent": 100,
  "startedAt": "2026-07-10T10:00:00.000Z",
  "submittedAt": "2026-07-10T10:04:00.000Z",
  "durationSeconds": 240
}
```

בתוצאה נשמר snapshot של נוסח השאלה, התשובה שנבחרה והתשובה הנכונה. לכן ניתן להציג ניסיון ישן גם אם המורה עורך את המבחן לאחר ההגשה.

### ניסיון פעיל (`ExamSession`)

```json
{
  "examId": "demo-js-exam",
  "studentId": "demo-student",
  "startedAt": "2026-07-11T10:00:00.000Z",
  "expiresAt": "2026-07-11T10:15:00.000Z",
  "questionOrder": ["question-2", "question-1"],
  "selectedAnswers": {
    "question-1": 0
  }
}
```

`ExamSessionService` שומר כל תשובה בזמן הבחירה. בזמן רענון הדף נטענים זמן הסיום, סדר השאלות והתשובות; כשהזמן מגיע לאפס נוצר ונשמר `Result` אוטומטית.

### קשרים בין הנתונים

- `Exam.teacherId` מפנה אל `User.id` של מורה.
- `Result.examId` מפנה אל `Exam.id`.
- `Result.studentId` מפנה אל `User.id` של סטודנט.
- `Result.answers[].questionId` מפנה אל `Question.id` שהיה קיים בזמן ההגשה.

---

## 4. המחלקות העיקריות - UML

```mermaid
classDiagram
  direction TB

  class User {
    +String id
    +String role
    +getDashboardRoute()
  }

  class Exam {
    +String id
    +String teacherId
    +Question[] questions
    +addQuestion()
    +updateQuestion()
    +removeQuestion()
  }

  class Question {
    +String id
    +String[] answers
    +Number correctAnswerIndex
    +isCorrect()
  }

  class Result {
    +String examId
    +String studentId
    +Number score
    +Number percent
  }

  class StorageService {
    +get()
    +set()
    +remove()
  }

  class AuthService {
    +register()
    +login()
    +logout()
  }

  class ExamService {
    +createExam()
    +updateExam()
    +searchExams()
    +deleteExam()
  }

  class ResultService {
    +calculateResult()
    +saveResult()
    +getResultsByStudent()
    +getResultsByExam()
  }

  class ExamSessionService {
    +startOrResume()
    +saveAnswer()
    +getRemainingSeconds()
    +finish()
  }

  Exam "1" *-- "0..*" Question
  User "1" --> "0..*" Exam
  User "1" --> "0..*" Result
  Exam "1" --> "0..*" Result
  AuthService --> StorageService
  ExamService --> StorageService
  ResultService --> StorageService
  ExamSessionService --> StorageService
```

## 5. FLOW מרכזי - סטודנט מבצע מבחן

התרשים מציג מי קורא למי ומה עובר בין המודולים בתהליך המרכזי:

```mermaid
sequenceDiagram
  actor Student as סטודנט
  participant SearchPage as search.js
  participant Exams as ExamService
  participant TakePage as take-exam.js
  participant Results as ResultService
  participant Session as ExamSessionService
  participant Storage as StorageService

  Student->>SearchPage: query, category
  SearchPage->>Exams: searchExams(query, category)
  Exams->>Storage: get("exams")
  Exams-->>SearchPage: Exam[]
  Student->>TakePage: open examId
  TakePage->>Exams: getExamById(examId)
  Exams->>Storage: get("exams")
  Exams-->>TakePage: Exam
  TakePage->>Session: startOrResume(exam, studentId)
  Session->>Storage: get/set("examSessions")
  Student->>TakePage: selectedAnswers
  TakePage->>Session: saveAnswer(questionId, answerIndex)
  TakePage->>Results: calculateResult(exam, student, answers, startedAt)
  Results-->>TakePage: Result
  TakePage->>Results: saveResult(result)
  Results->>Storage: get("results")
  Storage-->>Results: Result[]
  Results->>Storage: set("results", results + result)
  TakePage->>Session: finish(examId, studentId)
  TakePage-->>Student: score and correct answers
```

הקלט המרכזי הוא `{ questionId: answerIndex }`. הפלט הוא אובייקט `Result`, הנשמר ב-`quizproj.results` ומוצג בדף הסטודנט ובתוצאות המורה.

---

## 6. מבנה הפרויקט

```text
QuizProj/
|-- server.js                 # שרת Express ונתיבי app.get
|-- package.json              # תלויות ופקודות npm
|-- README.md                 # מסמך טכני והוראות הרצה
|-- TECHNICAL_DOCUMENT.md     # מסמך טכני מורחב
|-- client/
|   |-- index.html
|   |-- pages/                # דפי מורה, סטודנט, הרשמה, התחברות ומבחנים
|   `-- assets/
|       |-- css/styles.css
|       `-- js/
|           |-- models/       # מחלקות User, Exam, Question, Result
|           |-- services/     # Auth, Exam, Result, ExamSession, Storage, Seed
|           |-- pages/        # לוגיקת DOM לכל דף
|           |-- ui/           # תפריט, מצב כהה והודעות
|           `-- utils/        # ניווט, HTML וייצוא קבצים
`-- index.html                # הפניה לתיקיית client עבור GitHub Pages
```

## 7. הערות ארכיטקטורה

- המערכת פועלת ללא Backend עסקי: אין API ואין מסד נתונים.
- Express מוגדר ב-`server.js` עם `express.static(clientDir)` ועם `app.get` לכל דף.
- ה-DI מתבצע באמצעות בנאי השירותים, לדוגמה `new AuthService(storage)`. כאשר לא מעבירים שירות אחסון, נוצר `StorageService` כברירת מחדל.
- `SeedService` משלים משתמשי הדגמה ומבחן JavaScript אם הם חסרים, בלי לדרוס נתונים קיימים.
- גישה לדפי תפקיד נבדקת מול המשתמש המחובר. מורה יכול לנהל רק מבחן שה-`teacherId` שלו שווה למזהה המורה.
- מחיקת מבחן כוללת גם מחיקת התוצאות המקושרות אליו.
