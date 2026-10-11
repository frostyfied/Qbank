# QBank API Contract Documentation

> **Status:** Proposed Contract v1.0  
> **Last Updated:** October 2026  
> **Target Audience:** Frontend & Backend Engineers

This contract outlines the agreed REST interfaces between the Vite React frontend and the Express.js backend.

---

## 1. Global Conventions

- **Base URL:** `http://localhost:5000/api` (configurable via `VITE_API_BASE_URL`)
- **Format:** `application/json` for requests and responses.
- **Cookies & Session:** `credentials: 'include'` on all client HTTP calls. JWT is passed via an HTTP-Only secure cookie named `qbank_token`.
- **Standard Error Payload:**
  ```json
  {
    "message": "Human-readable error description",
    "code": "OPTIONAL_ERROR_CODE",
    "details": {}
  }
  ```

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /auth/register`
Creates a new student account.
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@university.edu",
    "password": "Password123!"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "user": {
      "id": "67087812bc8f3014",
      "name": "Jane Doe",
      "email": "jane@university.edu",
      "role": "student"
    }
  }
  ```
- Sets HTTP-Only cookie.

### `POST /auth/login`
Authenticates a user.
- **Request Body:**
  ```json
  {
    "email": "jane@university.edu",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`:** Same as register response. Sets HTTP-Only cookie.
- **Response `401 Unauthorized`:** `{ "message": "Invalid email or password" }`

### `POST /auth/logout`
Clears authentication cookie.
- **Response `200 OK`:** `{ "message": "Logged out successfully" }`

### `GET /auth/me`
Fetches current authenticated profile from cookie session.
- **Response `200 OK`:** `{ "user": { "id": "...", "name": "...", "email": "...", "role": "student" } }`
- **Response `401 Unauthorized`:** `{ "message": "Not authenticated" }`

---

## 3. Question Bank Endpoints (`/api/questions`)

### `GET /questions`
Fetches paginated questions.
- **Query Parameters:**
  - `page`: integer (default 1)
  - `limit`: integer (default 10)
  - `search`: string
  - `subject`: string (Subject name or ID)
  - `topic`: string
  - `semester`: integer (1-8)
  - `difficulty`: `'easy' | 'medium' | 'hard'`
  - `type`: `'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'long_answer' | 'programming'`
- **Response `200 OK`:**
  ```json
  {
    "questions": [
      {
        "id": "q101",
        "text": "What is the worst-case time complexity of QuickSort?",
        "type": "mcq",
        "subject": "Data Structures & Algorithms",
        "topic": "Sorting Algorithms",
        "semester": 3,
        "difficulty": "medium",
        "marks": 2,
        "tags": ["dsa", "sorting"],
        "options": ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"],
        "isBookmarked": false,
        "createdAt": "2026-10-10T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### `GET /questions/:id`
Fetch single question details (includes explanation if authorized).
- **Response `200 OK`:** Question detail object.

### `POST /questions`
Create a question.
- **Request Body:**
  ```json
  {
    "text": "Explain the ACID properties of database transactions.",
    "type": "long_answer",
    "subject": "Database Management Systems",
    "topic": "Transaction Management",
    "semester": 4,
    "difficulty": "medium",
    "marks": 5,
    "tags": ["dbms", "acid"],
    "explanation": "Atomicity, Consistency, Isolation, Durability...",
    "isPrivate": false
  }
  ```
- **Response `201 Created`:** Created question object.

### `PATCH /questions/:id`
Update an existing question.

### `DELETE /questions/:id`
Soft-deletes question.
- **Response `200 OK`:** `{ "message": "Question deleted successfully" }`

### `GET /questions/pending`
Lists questions submitted by students awaiting teacher review.

### `POST /questions/:id/review`
Approve or reject a student-submitted question.
- **Request Body:** `{ "action": "approve" | "reject", "feedback": "Clear explanation needed." }`

---

## 4. Subject Endpoints (`/api/subjects`)

### `GET /subjects`
Returns all subjects with topics.
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "sub_cs101",
      "name": "Data Structures & Algorithms",
      "code": "CS201",
      "semester": 3,
      "topics": ["Arrays", "Linked Lists", "Trees", "Sorting"]
    }
  ]
  ```

---

## 5. Bookmark Endpoints (`/api/bookmarks`)

- `GET /bookmarks` -> List of user's bookmarked questions.
- `POST /bookmarks/:questionId` -> `{ "message": "Bookmarked" }`
- `DELETE /bookmarks/:questionId` -> `{ "message": "Bookmark removed" }`

---

## 6. Quiz Endpoints (`/api/quizzes`)

- `POST /quizzes/generate` -> Generate practice quiz questions based on selected criteria.
- `POST /quizzes/:id/submit` -> Submit answers, evaluate auto-gradable questions, calculate score.
- `GET /quiz-attempts` -> User's history of practice attempts.
- `GET /quiz-attempts/:id` -> Single attempt breakdown.

---

## 7. User & Administration Endpoints (`/api/users`)

- `GET /users` -> List users with roles.
- `PATCH /users/:id/role` -> Change role (`student`, `teacher`, `admin`).
