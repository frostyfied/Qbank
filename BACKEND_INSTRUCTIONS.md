# QBank — Backend Architecture & Integration Guide

> **Notice for Backend Engineers:**
> This document details the architectural expectations, data schemas, authentication protocol, and exact API contracts designed to interface seamlessly with the QBank frontend client.
> The frontend is strictly built with **zero mock data**. All pages expect the HTTP endpoints detailed below and handle real loading, empty, and error responses.

---

## 1. Stack & Architecture Overview

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT stored in `HttpOnly`, `SameSite=Lax` cookies
- **Base API Path**: `/api` (default port: `5000`, e.g. `http://localhost:5000/api`)
- **CORS Configuration**:
  ```javascript
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));
  ```

---

## 2. Core Data Models (MongoDB / Mongoose)

### 2.1 User Model (`users`)
```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  email: string;           // Unique, lowercase, indexed
  passwordHash: string;    // bcrypt hashed (never exposed to frontend)
  role: 'student' | 'teacher' | 'admin'; // Default: 'student'
  createdAt: Date;
  updatedAt: Date;
}
```
*Note: Public registration must always default to `role: 'student'`. Teachers and Admins are assigned exclusively via administrative routes.*

---

### 2.2 Question Model (`questions`)
```typescript
interface IQuestion {
  _id: ObjectId;
  text: string;                             // Markdown / plain text question prompt
  type: 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'long_answer' | 'programming';
  subjectId: ObjectId;                      // Reference to Subject
  subjectName: string;                      // Cached name for quick listing
  topic: string;                            // E.g., "Binary Search Trees", "Thermodynamics"
  semester: number;                         // 1 to 8
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;                            // E.g., 1, 2, 5, 10
  tags: string[];                           // E.g., ["algorithms", "midterm-2024"]
  explanation?: string;                     // Detailed explanation / solution note
  
  // Type-specific answer configuration
  options?: string[];                       // For MCQ: list of choice strings (e.g. 4 options)
  correctAnswer?: string | boolean;         // For MCQ, T/F, FillBlank. (Omitted in practice quizzes until submitted)
  acceptedAnswers?: string[];               // For Fill-in-the-blank (case variations / synonyms)
  sampleCode?: string;                      // For Programming questions (starter template)
  programmingLanguage?: string;             // E.g., 'python', 'javascript', 'java', 'cpp'

  // Workflow & Permissions
  authorId: ObjectId;                       // User who submitted/created
  authorName: string;
  isPrivate: boolean;                       // If true, visible only to author student for practice
  status: 'pending' | 'approved' | 'rejected' | 'published';
  reviewFeedback?: string;                  // Comments left by reviewing teacher
  reviewedBy?: ObjectId;                   // Teacher who reviewed
  reviewedAt?: Date;

  isDeleted: boolean;                       // Soft deletion flag (default: false)
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.3 Subject & Topic Model (`subjects`)
```typescript
interface ISubject {
  _id: ObjectId;
  name: string;                             // E.g., "Data Structures and Algorithms"
  code: string;                             // E.g., "CS201"
  semester: number;                         // 1 to 8
  description?: string;
  topics: string[];                         // List of topic names under this subject
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.4 Bookmark Model (`bookmarks`)
```typescript
interface IBookmark {
  _id: ObjectId;
  userId: ObjectId;                         // Indexed compound with questionId
  questionId: ObjectId;                     // Reference to Question
  createdAt: Date;
}
// Unique compound index: { userId: 1, questionId: 1 }
```

---

### 2.5 Quiz Attempt Model (`quiz_attempts`)
```typescript
interface IQuizAttempt {
  _id: ObjectId;
  userId: ObjectId;
  subjectId?: ObjectId;
  subjectName?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'all';
  totalQuestions: number;
  timeLimitMinutes?: number;                // null if untimed
  durationSecondsTaken: number;
  
  questions: Array<{
    questionId: ObjectId;
    text: string;
    type: string;
    marks: number;
    options?: string[];
    userAnswer?: string | boolean;
    correctAnswer?: string | boolean;
    explanation?: string;
    isCorrect?: boolean;                   // Evaluated for auto-gradable types
    awardedMarks?: number;
    gradingStatus: 'auto_graded' | 'pending_review' | 'manual_graded';
    teacherComment?: string;
  }>;

  score: number;                            // Sum of awardedMarks
  maxScore: number;                         // Sum of all question marks
  percentage: number;                       // (score / maxScore) * 100
  overallGradingStatus: 'completed' | 'pending_manual_grading';
  submittedAt: Date;
}
```

---

## 3. REST API Contract & Endpoints

All responses should return standard JSON. On error, return appropriate HTTP status code (`400`, `401`, `403`, `404`, `500`) with `{ "message": "Clear explanation" }`.

### 3.1 Authentication (`/api/auth`)

| Method | Endpoint | Description | Request Body | Response Payload |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new student | `{ "name": "...", "email": "...", "password": "..." }` | `{ "user": { "_id", "name", "email", "role": "student" } }` (Sets cookie) |
| `POST` | `/api/auth/login` | Log in user | `{ "email": "...", "password": "..." }` | `{ "user": { "_id", "name", "email", "role": "..." } }` (Sets cookie) |
| `POST` | `/api/auth/logout` | Log out | None | `{ "message": "Logged out successfully" }` (Clears cookie) |
| `GET` | `/api/auth/me` | Fetch active user session | None (reads cookie) | `{ "user": { "_id", "name", "email", "role": "..." } }` |

**Cookie Specification:**
- Name: `qbank_token` (or `token`)
- Options: `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days)

---

### 3.2 Question Management (`/api/questions`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/questions` | Any Authenticated | Fetch paginated public questions with query filters |
| `GET` | `/api/questions/:id` | Any Authenticated | Get full question details |
| `POST` | `/api/questions` | Student / Teacher | Create question. Teacher creates `published`. Student creates `pending` (for review) or `isPrivate: true` |
| `PATCH` | `/api/questions/:id` | Teacher / Admin (or Student author if draft) | Update question text/metadata |
| `DELETE` | `/api/questions/:id` | Teacher / Admin | Soft delete (`isDeleted: true`) |
| `GET` | `/api/questions/pending` | Teacher / Admin | List student submissions awaiting review |
| `POST` | `/api/questions/:id/review` | Teacher / Admin | Approve or reject submission (`{ "action": "approve" \| "reject", "feedback": "..." }`) |

**Query parameters supported for `GET /api/questions`:**
- `page` (default 1), `limit` (default 10)
- `search` (keyword search on `text`, `tags`, or `topic`)
- `subject` (subject ID or name)
- `topic`
- `semester` (1-8)
- `difficulty` (`easy`, `medium`, `hard`)
- `type` (`mcq`, `true_false`, `fill_blank`, `short_answer`, `long_answer`, `programming`)

**Response format for `GET /api/questions`:**
```json
{
  "questions": [ /* Question objects */ ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### 3.3 Subjects & Topics (`/api/subjects`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/subjects` | Any Authenticated | Returns list of all subjects and their topics |
| `POST` | `/api/subjects` | Admin | Create subject (`{ "name", "code", "semester", "description", "topics": [] }`) |
| `PATCH` | `/api/subjects/:id` | Admin | Update subject or append topics |
| `DELETE` | `/api/subjects/:id` | Admin | Delete subject |

---

### 3.4 Bookmarks (`/api/bookmarks`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/bookmarks` | Student / Teacher | List bookmarked questions of current user |
| `POST` | `/api/bookmarks/:questionId` | Any Authenticated | Bookmark a question |
| `DELETE` | `/api/bookmarks/:questionId` | Any Authenticated | Unbookmark a question |

---

### 3.5 Practice Quizzes (`/api/quizzes`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/quizzes/generate` | Student | Generate practice quiz based on criteria (`{ "subjectId", "difficulty", "count", "type", "timeLimit" }`). Note: **Do not reveal `correctAnswer` in returned question objects!** |
| `POST` | `/api/quizzes/:id/submit` | Student | Submit user answers (`{ "answers": [{ "questionId", "userAnswer" }], "durationSeconds" }`). Backend auto-grades MCQ/TF/FillBlank and marks others `pending_review`. Returns evaluated attempt with scores and explanations. |
| `GET` | `/api/quiz-attempts` | Student | List user's past quiz attempts |
| `GET` | `/api/quiz-attempts/:id` | Student / Teacher | Detailed breakdown of a specific attempt |

---

### 3.6 Administration (`/api/users`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | Paginated list of users (`page`, `search`, `role`) |
| `PATCH` | `/api/users/:id/role` | Admin | Update user role (`{ "role": "teacher" \| "student" \| "admin" }`) |

---

## 4. Grading Rules (Crucial for Quiz Engine)

1. **Auto-Graded Types**:
   - `mcq`: Exact match with `correctAnswer`.
   - `true_false`: Exact boolean match.
   - `fill_blank`: Trimmed, case-insensitive match against `correctAnswer` or `acceptedAnswers` array.
2. **Manually Graded Types**:
   - `short_answer` & `long_answer`: Flagged as `gradingStatus: 'pending_review'`.
   - `programming`: Flagged as `gradingStatus: 'pending_review'`. *Do not execute code on the server.* Teachers review code submission manually.
3. **Attempt Scores**:
   - Automatic score reflects sum of awarded marks on auto-graded questions.
   - If manual questions exist, mark attempt `overallGradingStatus: 'pending_manual_grading'`.

---

## 5. Development Mode & Frontend Testing

While backend development is in progress, the frontend includes a **Development Preview Mode** activated with `VITE_DEV_AUTH_BYPASS=true` in `client/.env`.
- This lets you or any teammate preview all Student, Teacher, and Administrator layouts instantly without real credentials.
- When your backend endpoints are ready, run the Express server on `http://localhost:5000`, set `VITE_DEV_AUTH_BYPASS=false` in the frontend client, and test the real authentication and data flow immediately.
- To permanently remove the dev preview mode later, simply delete the `client/src/dev-preview/` directory and remove the 2 imports in `providers.tsx` and `AppShell.tsx`.

---

## 6. Recommended Backend `.env`

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/qbank
JWT_SECRET=super_secret_qbank_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
```
