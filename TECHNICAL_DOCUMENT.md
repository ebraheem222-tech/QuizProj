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

### מפת ניווט

```mermaid
flowchart TD
  Home[דף ראשי] --> Register[הרשמה]
  Home --> Login[התחברות]
  Register -->|role = teacher| Teacher[דף מורה]
  Register -->|role = student| Student[דף סטודנט]
  Login -->|role = teacher| Teacher
  Login -->|role = student| Student
  Teacher --> ExamDetails[פרטי מבחן]
  ExamDetails --> Teacher
  Student --> Search[חיפוש מבחן]
  Search --> TakeExam[ביצוע מבחן]
  TakeExam --> Student
  TakeExam --> Search
  Teacher -->|התנתקות| Home
  Student -->|התנתקות| Home
```

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

### קשרים בין הנתונים

- `Exam.teacherId` מפנה אל `User.id` של מורה.
- `Result.examId` מפנה אל `Exam.id`.
- `Result.studentId` מפנה אל `User.id` של סטודנט.
- `Result.answers[].questionId` מפנה אל `Question.id` שהיה קיים בזמן ההגשה.

---

## 4. המחלקות העיקריות - UML

```mermaid
classDiagram
  class User {
    +String id
    +String fullName
    +String nationalId
    +String email
    +String password
    +String role
    +String createdAt
    +from(data) User
    +isTeacher() Boolean
    +isStudent() Boolean
    +getDashboardRoute() String
  }

  class Exam {
    +String id
    +String teacherId
    +String title
    +String description
    +String category
    +String code
    +Number durationMinutes
    +Boolean shuffleQuestions
    +Question[] questions
    +addQuestion(data)
    +updateQuestion(id, data)
    +removeQuestion(id)
    +getQuestionCount() Number
    +hasSearchMatch(query) Boolean
  }

  class Question {
    +String id
    +String text
    +String[] answers
    +Number correctAnswerIndex
    +String difficulty
    +isCorrect(answerIndex) Boolean
  }

  class Result {
    +String id
    +String examId
    +String studentId
    +Object[] answers
    +Number score
    +Number percent
    +String submittedAt
  }

  class StorageService {
    +String prefix
    +key(name) String
    +get(name, fallback) Any
    +set(name, value)
    +remove(name)
  }

  class AuthService {
    -StorageService storage
    +getUsers() User[]
    +getCurrentUser() User
    +register(userData) User
    +login(identifier, password) User
    +logout()
  }

  class ExamService {
    -StorageService storage
    +getAllExams() Exam[]
    +getExamById(id) Exam
    +getExamsByTeacher(teacherId) Exam[]
    +searchExams(query, category) Exam[]
    +createExam(data) Exam
    +updateExam(id, updates) Exam
    +saveExam(exam) Exam
    +deleteExam(id)
    +exportExam(id) String
    +importExam(json, teacherId) Exam
  }

  class ResultService {
    -StorageService storage
    +getResultsByStudent(id) Result[]
    +getResultsByExam(id) Result[]
    +calculateResult(data) Result
    +saveResult(result) Result
    +deleteResultsByExam(id)
    +getStudentAverage(id) Number
  }

  Exam "1" *-- "0..*" Question : contains
  User "1" --> "0..*" Exam : teacher creates
  User "1" --> "0..*" Result : student receives
  Exam "1" --> "0..*" Result : has
  AuthService --> StorageService : reads/writes users
  ExamService --> StorageService : reads/writes exams
  ResultService --> StorageService : reads/writes results
  AuthService ..> User : creates
  ExamService ..> Exam : creates
  ResultService ..> Result : creates
```

### אחריות המחלקות

- `User`, `Exam`, `Question`, `Result`: מודלי הנתונים והפעולות ששייכות לאובייקט עצמו.
- `StorageService`: שכבת גישה יחידה ל-`localStorage` ולטיפול ב-JSON.
- `AuthService`: הרשמה, התחברות, התנתקות וקבלת המשתמש הנוכחי.
- `ExamService`: יצירה, עריכה, חיפוש, מחיקה, ייבוא וייצוא של מבחנים.
- `ResultService`: חישוב ציון, שמירת ניסיון, שליפת היסטוריה וחישוב ממוצע.
- מודולי `pages/`: קוראים את הטפסים והאירועים מה-DOM ומפעילים את השירות המתאים.

---

## 5. תזרימי מערכת מרכזיים

### FLOW 1 - הרשמה והפניה לפי תפקיד

```mermaid
sequenceDiagram
  actor Visitor as משתמש חדש
  participant RegisterPage as register.js
  participant Auth as AuthService
  participant UserModel as User
  participant Storage as StorageService
  participant Router as router.js

  Visitor->>RegisterPage: שולח fullName, nationalId, email, password, role
  RegisterPage->>Auth: register(userData)
  Auth->>Storage: get("users", [])
  Auth->>Auth: בדיקת role, אימייל ותעודת זהות
  Auth->>UserModel: new User(userData)
  Auth->>Storage: set("users", users + user)
  Auth->>Storage: set("currentUserId", user.id)
  Auth-->>RegisterPage: User
  RegisterPage->>Router: goTo(user.getDashboardRoute())
  Router-->>Visitor: /teacher או /student
```

המידע שעובר: אובייקט `userData`. הפלט הוא אובייקט `User` והנתיב נקבע לפי `role`.

### FLOW 2 - מורה יוצר ועורך מבחן

```mermaid
sequenceDiagram
  actor Teacher as מורה
  participant TeacherPage as teacher.js
  participant DetailsPage as exam-details.js
  participant ExamService
  participant ExamModel as Exam
  participant Storage as StorageService

  Teacher->>TeacherPage: ממלא title, description, category, code, duration
  TeacherPage->>ExamService: createExam(examData + teacherId)
  ExamService->>ExamModel: new Exam(examData)
  ExamService->>Storage: set("exams", exams + exam)
  ExamService-->>TeacherPage: Exam
  TeacherPage-->>DetailsPage: ניווט /exam/:id
  Teacher->>DetailsPage: מוסיף שאלה, תשובות ואינדקס נכון
  DetailsPage->>ExamModel: addQuestion(questionData)
  DetailsPage->>ExamService: saveExam(exam)
  ExamService->>Storage: set("exams", updatedExams)
```

המידע שעובר: `examData`, מזהה המורה, ובהמשך `questionData`. המבחן כולו נשמר מחדש במערך `quizproj.exams`.

### FLOW 3 - סטודנט מחפש ומבצע מבחן

```mermaid
sequenceDiagram
  actor Student as סטודנט
  participant SearchPage as search.js
  participant TakePage as take-exam.js
  participant ExamService
  participant ResultService
  participant Storage as StorageService

  Student->>SearchPage: מזין query ו-category
  SearchPage->>ExamService: searchExams(query, category)
  ExamService->>Storage: get("exams", [])
  ExamService-->>SearchPage: Exam[]
  Student->>TakePage: בחירת /take/:id
  TakePage->>ExamService: getExamById(id)
  Student->>TakePage: בחירת תשובות ושליחה
  TakePage->>ResultService: calculateResult(exam, student, selectedAnswers, startedAt)
  ResultService-->>TakePage: Result
  TakePage->>ResultService: saveResult(result)
  ResultService->>Storage: set("results", results + result)
  TakePage-->>Student: ציון ותשובות נכונות
```

המידע שעובר: מחרוזת חיפוש, קטגוריה, מזהה מבחן ומפה מסוג `{ questionId: answerIndex }`. הפלט הוא אובייקט `Result` מלא.

### FLOW 4 - מורה צופה בתוצאות תלמידים

```mermaid
sequenceDiagram
  actor Teacher as מורה
  participant DetailsPage as exam-details.js
  participant Auth as AuthService
  participant ExamService
  participant ResultService
  participant Storage as StorageService

  Teacher->>DetailsPage: פתיחת /exam/:id
  DetailsPage->>Auth: getCurrentUser()
  DetailsPage->>ExamService: getExamById(id)
  DetailsPage->>DetailsPage: בדיקה exam.teacherId = teacher.id
  DetailsPage->>ResultService: getResultsByExam(id)
  ResultService->>Storage: get("results", [])
  ResultService-->>DetailsPage: Result[] ממוין לפי submittedAt
  DetailsPage-->>Teacher: שם תלמיד, ציון, אחוז ותאריך
```

---

## 6. מבנה הפרויקט

```text
QuizProj/
|-- server.js                 # שרת Express ונתיבי app.get
|-- package.json              # תלויות ופקודות npm
|-- README.md                 # הוראות ופיצ'רים
|-- TECHNICAL_DOCUMENT.md     # מסמך זה
|-- client/
|   |-- index.html
|   |-- pages/                # דפי מורה, סטודנט, הרשמה, התחברות ומבחנים
|   `-- assets/
|       |-- css/styles.css
|       `-- js/
|           |-- models/       # מחלקות User, Exam, Question, Result
|           |-- services/     # Auth, Exam, Result, Storage, Seed
|           |-- pages/        # לוגיקת DOM לכל דף
|           |-- ui/           # תפריט, מצב כהה והודעות
|           `-- utils/        # ניווט, HTML וייצוא קבצים
`-- index.html                # הפניה לתיקיית client עבור GitHub Pages
```

## 7. הערות ארכיטקטורה

- המערכת פועלת ללא Backend עסקי: אין API ואין מסד נתונים.
- Express מוגדר ב-`server.js` עם `express.static(clientDir)` ועם `app.get` לכל דף.
- ה-DI מתבצע באמצעות בנאי השירותים, לדוגמה `new AuthService(storage)`. כאשר לא מעבירים שירות אחסון, נוצר `StorageService` כברירת מחדל.
- `SeedService` מוסיף משתמשי הדגמה ומבחן לדוגמה רק כאשר האחסון ריק.
- גישה לדפי תפקיד נבדקת מול המשתמש המחובר. מורה יכול לנהל רק מבחן שה-`teacherId` שלו שווה למזהה המורה.
- מחיקת מבחן כוללת גם מחיקת התוצאות המקושרות אליו.

