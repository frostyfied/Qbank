export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  questions: {
    list: '/questions',
    detail: (id: string) => `/questions/${id}`,
    create: '/questions',
    update: (id: string) => `/questions/${id}`,
    delete: (id: string) => `/questions/${id}`,
    pending: '/questions/pending',
    review: (id: string) => `/questions/${id}/review`,
  },
  subjects: {
    list: '/subjects',
    create: '/subjects',
    update: (id: string) => `/subjects/${id}`,
    delete: (id: string) => `/subjects/${id}`,
  },
  bookmarks: {
    list: '/bookmarks',
    toggle: (questionId: string) => `/bookmarks/${questionId}`,
    add: (questionId: string) => `/bookmarks/${questionId}`,
    remove: (questionId: string) => `/bookmarks/${questionId}`,
  },
  quizzes: {
    generate: '/quizzes/generate',
    detail: (id: string) => `/quizzes/${id}`,
    submit: (id: string) => `/quizzes/${id}/submit`,
    attempts: '/quiz-attempts',
    attemptDetail: (id: string) => `/quiz-attempts/${id}`,
  },
  users: {
    list: '/users',
    updateRole: (id: string) => `/users/${id}/role`,
  },
} as const;
