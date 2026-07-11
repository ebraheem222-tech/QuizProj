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

  class ExamSessionService {
    -StorageService storage
    +startOrResume(data) Object
    +saveAnswer(examId, studentId, questionId, answerIndex)
    +getRemainingSeconds(session) Number
    +finish(examId, studentId)
  }

  Exam "1" *-- "0..*" Question
  User "1" --> "0..*" Exam
  User "1" --> "0..*" Result
  Exam "1" --> "0..*" Result
  AuthService --> StorageService
  ExamService --> StorageService
  ResultService --> StorageService
  ExamSessionService --> StorageService
  AuthService ..> User
  ExamService ..> Exam
  ResultService ..> Result
```

### אחריות המחלקות

- `User`, `Exam`, `Question`, `Result`: מודלי הנתונים והפעולות ששייכות לאובייקט עצמו.
- `StorageService`: שכבת גישה יחידה ל-`localStorage` ולטיפול ב-JSON.
- `AuthService`: הרשמה, התחברות, התנתקות וקבלת המשתמש הנוכחי.
- `ExamService`: יצירה, עריכה, חיפוש, מחיקה, ייבוא וייצוא של מבחנים.
- `ResultService`: חישוב ציון, שמירת ניסיון, שליפת היסטוריה וחישוב ממוצע.
- `ExamSessionService`: שמירת זמן הסיום, סדר השאלות והתשובות בזמן מבחן פעיל.
- מודולי `pages/`: קוראים את הטפסים והאירועים מה-DOM ומפעילים את השירות המתאים.

---

## 5. תזרימי מערכת מרכזיים

כל התזרימים הבאים נבדקו מול מודולי הדפים, השירותים והמודלים בפועל.

| תהליך שנבדק | תוצאה | הערה |
|---|---|---|
| הרשמה והתחברות | תקין | נשמר `currentUserId` ומתבצעת הפניה לפי `role` |
| הגנת דפים לפי תפקיד | תוקן ואומת | משתמש חסר מופנה להתחברות; תפקיד שגוי מופנה לדשבורד שלו ומודול הדף מקבל `null` |
| יצירת מבחן | תוקן בתרשים | לאחר יצירה הרשימה מתרעננת; אין מעבר אוטומטי לדף הפרטים |
| עריכת מבחן ושאלות | תקין | נבדקת בעלות המורה לפני רינדור ונשמר המבחן המעודכן |
| מחיקת מבחן | תקין | `teacher.js` מפעיל בנפרד מחיקת מבחן ומחיקת תוצאות |
| חיפוש וביצוע מבחן | תקין | מוצגים רק מבחנים שיש בהם לפחות שאלה אחת |
| טיימר ושליחת תשובות | תקין | הזמן והתשובות נשמרים; יציאה דורשת אישור ושאלות ללא תשובה מסומנות |
| היסטוריה ותוצאות מורה | תקין | תוצאות מסוננות לפי סטודנט או מבחן וממוינות מהחדש לישן |

### FLOW 1 - הרשמה והפניה לפי תפקיד

```mermaid
sequenceDiagram
  actor Visitor as משתמש חדש
  participant RegisterPage as register.js
  participant Auth as AuthService
  participant Storage as StorageService
  participant Nav as router.js

  Visitor->>RegisterPage: submit userData
  RegisterPage->>Auth: register(userData)
  Auth->>Storage: get("users", [])
  Auth->>Auth: validate role, email, ID
  alt invalid or duplicate data
    Auth-->>RegisterPage: throw Error
    RegisterPage-->>Visitor: show error message
  else valid data
    Auth->>Auth: new User(userData)
    Auth->>Storage: set("users", users + user)
    Auth->>Storage: set("currentUserId", user.id)
    Auth-->>RegisterPage: User
    RegisterPage->>Nav: goTo(user.getDashboardRoute())
    Nav-->>Visitor: open role dashboard
  end
```

המידע שעובר: אובייקט `userData` עם שם, תעודת זהות, אימייל, סיסמה ותפקיד. בהצלחה מוחזר `User`; בכישלון נזרק `Error` ולא נשמר מידע חלקי.

### FLOW 2 - התחברות והפניה לדשבורד

```mermaid
sequenceDiagram
  actor AccountUser as משתמש קיים
  participant LoginPage as login.js
  participant Auth as AuthService
  participant Storage as StorageService
  participant Nav as router.js

  AccountUser->>LoginPage: submit credentials
  LoginPage->>Auth: login(identifier, password)
  Auth->>Storage: get("users", [])
  Auth->>Auth: match identifier and password
  alt credentials are invalid
    Auth-->>LoginPage: throw Error
    LoginPage-->>AccountUser: show error message
  else credentials are valid
    Auth->>Storage: set("currentUserId", user.id)
    Auth-->>LoginPage: User
    LoginPage->>Nav: goTo(user.getDashboardRoute())
    Nav-->>AccountUser: open role dashboard
  end
```

`identifier` יכול להיות אימייל או תעודת זהות. הדשבורד נקבע על ידי `User.getDashboardRoute()`.

### FLOW 3 - הגנת דף לפי תפקיד והתנתקות

```mermaid
sequenceDiagram
  actor AccountUser as משתמש
  participant PageModule as page module
  participant Layout as layout.js
  participant Auth as AuthService
  participant Storage as StorageService
  participant Nav as router.js

  AccountUser->>PageModule: open protected route
  PageModule->>Layout: initializePage(requireRole)
  Layout->>Auth: getCurrentUser()
  Auth->>Storage: get session data
  Auth-->>Layout: User or null
  alt no active session
    Layout->>Nav: goTo("login")
    Layout-->>PageModule: currentUser = null
  else role does not match
    Layout->>Nav: goTo(actual dashboard)
    Layout-->>PageModule: currentUser = null
  else role matches
    Layout-->>PageModule: currentUser = User
    PageModule-->>AccountUser: render protected page
  end
  opt click logout in header
    AccountUser->>Layout: click logout
    Layout->>Auth: logout()
    Auth->>Storage: remove("currentUserId")
    Layout->>Nav: goTo("home")
  end
```

החזרת `currentUser = null` במקרה של תפקיד שגוי מונעת ממודול הדף להתחיל לרנדר בזמן שמתבצע ה-redirect.

### FLOW 4 - מורה יוצר מבחן

```mermaid
sequenceDiagram
  actor Teacher as מורה
  participant TeacherPage as teacher.js
  participant Exams as ExamService
  participant Storage as StorageService
  participant DetailsPage as exam-details.js

  Teacher->>TeacherPage: submit examData
  TeacherPage->>Exams: createExam(data)
  Exams->>Storage: get("exams", [])
  Exams->>Exams: validate or generate code
  Exams->>Exams: new Exam(examData)
  Exams->>Storage: set("exams", updated list)
  Exams-->>TeacherPage: Exam
  TeacherPage->>TeacherPage: reset form, refresh list
  TeacherPage-->>Teacher: show created exam in list
  Note over TeacherPage,Teacher: No automatic redirect after creation
  Teacher->>DetailsPage: click management link /exam/:id
```

`examData` כולל `teacherId`, שם, תיאור, קטגוריה, קוד, משך והגדרת ערבוב. אם הקוד ריק השירות יוצר קוד ייחודי.

### FLOW 5 - מורה עורך מבחן ומנהל שאלות

```mermaid
sequenceDiagram
  actor Teacher as מורה
  participant DetailsPage as exam-details.js
  participant Exams as ExamService
  participant ExamModel as Exam
  participant Storage as StorageService

  Teacher->>DetailsPage: open /exam/:id
  DetailsPage->>Exams: getExamById(id)
  Exams->>Storage: get("exams", [])
  Exams-->>DetailsPage: Exam or null
  alt exam missing or owned by another teacher
    DetailsPage-->>Teacher: show ownership error
  else teacher owns the exam
    opt update general details
      Teacher->>DetailsPage: submit updates
      DetailsPage->>Exams: updateExam(exam.id, updates)
      Exams->>Storage: set("exams", updated list)
      Exams-->>DetailsPage: updated Exam
    end
    opt question action
      Teacher->>DetailsPage: submit question action
      alt add or edit
        DetailsPage->>DetailsPage: new Question(data)
        DetailsPage->>ExamModel: add or update question
      else delete
        DetailsPage->>ExamModel: remove question
      end
      DetailsPage->>Exams: saveExam(exam)
      Exams->>Storage: set("exams", updated list)
    end
  end
```

המזהה מגיע מ-`/exam/:id` ב-Express או מהפרמטר `?id=` ב-GitHub Pages. בדיקת הבעלות מתבצעת לפני הצגת טפסי הניהול.

### FLOW 6 - מורה מוחק מבחן ותוצאות

```mermaid
sequenceDiagram
  actor Teacher as מורה
  participant TeacherPage as teacher.js
  participant Exams as ExamService
  participant Results as ResultService
  participant Storage as StorageService

  Teacher->>TeacherPage: click delete(examId)
  TeacherPage-->>Teacher: request confirmation
  alt deletion cancelled
    TeacherPage-->>Teacher: no data changes
  else deletion confirmed
    TeacherPage->>Exams: deleteExam(examId)
    Exams->>Storage: set("exams", filtered list)
    TeacherPage->>Results: deleteResultsByExam(examId)
    Results->>Storage: set("results", filtered list)
    TeacherPage->>TeacherPage: refresh dashboard and list
  end
```

המחיקה המדורגת מתוזמרת ב-`teacher.js`: `ExamService.deleteExam()` אינו מוחק תוצאות בעצמו, ולכן הדף מפעיל גם את `ResultService`.

### FLOW 7 - סטודנט מחפש ופותח מבחן

```mermaid
sequenceDiagram
  actor Student as סטודנט
  participant SearchPage as search.js
  participant Exams as ExamService
  participant Storage as StorageService
  participant TakePage as take-exam.js

  Student->>SearchPage: input query and category
  SearchPage->>Exams: searchExams(query, category)
  Exams->>Storage: get("exams", [])
  Exams->>Exams: filter available exams
  Exams-->>SearchPage: Exam[]
  SearchPage-->>Student: render available exams
  Student->>TakePage: open /take/:id
  TakePage->>Exams: getExamById(id)
  Exams->>Storage: get("exams", [])
  Exams-->>TakePage: Exam or null
  alt exam is missing
    TakePage-->>Student: show not found
  else exam has no questions
    TakePage-->>Student: show unavailable
  else exam is available
    TakePage->>TakePage: optional shuffle, start timer
    TakePage-->>Student: render exam form
  end
```

`searchExams()` מחפש בשם, בתיאור, בקטגוריה ובקוד, ומסיר מראש מבחנים ללא שאלות.

### FLOW 8 - שליחת מבחן, חישוב ושמירת ציון

```mermaid
sequenceDiagram
  actor Student as סטודנט
  participant TakePage as take-exam.js
  participant Results as ResultService
  participant Session as ExamSessionService
  participant QuestionModel as Question
  participant Storage as StorageService

  TakePage->>Session: startOrResume(exam, studentId)
  Session->>Storage: get/set("examSessions")
  Student->>TakePage: select answer
  TakePage->>Session: saveAnswer(questionId, answerIndex)
  alt timer reaches zero
    TakePage->>TakePage: submitExam(true)
  else student clicks submit
    Student->>TakePage: submitExam(false)
    opt answers missing in manual submit
      TakePage-->>Student: request confirmation
      break student cancels
        TakePage-->>Student: return without saving
      end
    end
  end
  TakePage->>TakePage: collect answers
  TakePage->>Results: calculateResult(payload)
  loop each question
    Results->>QuestionModel: isCorrect(answerIndex)
    QuestionModel-->>Results: true or false
  end
  Results-->>TakePage: Result snapshot
  TakePage->>Results: saveResult(result)
  Results->>Storage: get("results", [])
  Results->>Storage: set("results", results + result)
  TakePage->>Session: finish(examId, studentId)
  TakePage-->>Student: render score and answer review
```

המפה שנשלחת לחישוב היא `{ questionId: answerIndex }`. אם הסטודנט מבטל את אישור השליחה החסרה, הפונקציה נעצרת לפני חישוב או שמירה.

### FLOW 9 - היסטוריית סטודנט ותוצאות מורה

```mermaid
sequenceDiagram
  actor Viewer as משתמש
  participant StudentPage as student.js
  participant DetailsPage as exam-details.js
  participant Results as ResultService
  participant Auth as AuthService
  participant Storage as StorageService

  alt student opens dashboard
    Viewer->>StudentPage: open /student
    StudentPage->>Results: getResultsByStudent(studentId)
    Results->>Storage: get("results", [])
    Results-->>StudentPage: student results, newest first
    StudentPage->>Results: getStudentAverage(studentId)
    Results->>Storage: get("results", [])
    Results-->>StudentPage: average percent
    StudentPage-->>Viewer: render history and statistics
  else teacher opens exam details
    Viewer->>DetailsPage: open /exam/:id
    DetailsPage->>Results: getResultsByExam(examId)
    Results->>Storage: get("results", [])
    Results-->>DetailsPage: exam results, newest first
    loop each result row
      DetailsPage->>Auth: getUserById(studentId)
      Auth->>Storage: get("users", [])
      Auth-->>DetailsPage: User or null
    end
    DetailsPage-->>Viewer: render student result rows
  end
```

התוצאה שומרת snapshot של השאלה והתשובות, ולכן היסטוריית הסטודנט נשארת קריאה גם אם המבחן נערך לאחר ההגשה.

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
