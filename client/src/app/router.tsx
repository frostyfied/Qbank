import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { StudentDashboard } from '../features/dashboard/StudentDashboard';
import { TeacherDashboard } from '../features/dashboard/TeacherDashboard';
import { AdminDashboard } from '../features/dashboard/AdminDashboard';
import { QuestionBankPage } from '../features/questions/QuestionBankPage';
import { QuestionDetailPage } from '../features/questions/QuestionDetailPage';
import { QuestionFormPage } from '../features/questions/QuestionFormPage';
import { QuestionReviewPage } from '../features/questions/QuestionReviewPage';
import { QuizSetupPage } from '../features/quizzes/QuizSetupPage';
import { ActiveQuizPage } from '../features/quizzes/ActiveQuizPage';
import { QuizResultsPage } from '../features/quizzes/QuizResultsPage';
import { QuizHistoryPage } from '../features/quizzes/QuizHistoryPage';
import { BookmarksPage } from '../features/bookmarks/BookmarksPage';
import { SubjectListPage } from '../features/subjects/SubjectListPage';
import { UserManagementPage } from '../features/users/UserManagementPage';
import { RootRedirect } from '../components/layout/RootRedirect';
import { NotFoundPage } from '../components/feedback/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RootRedirect />,
      },
      {
        path: 'dashboard/student',
        element: (
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/teacher',
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'questions',
        element: <QuestionBankPage />,
      },
      {
        path: 'questions/create',
        element: <QuestionFormPage />,
      },
      {
        path: 'questions/:id',
        element: <QuestionDetailPage />,
      },
      {
        path: 'questions/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <QuestionFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'questions/review',
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <QuestionReviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quizzes/setup',
        element: <QuizSetupPage />,
      },
      {
        path: 'quizzes/history',
        element: <QuizHistoryPage />,
      },
      {
        path: 'quizzes/:id',
        element: <ActiveQuizPage />,
      },
      {
        path: 'quizzes/:id/results',
        element: <QuizResultsPage />,
      },
      {
        path: 'bookmarks',
        element: <BookmarksPage />,
      },
      {
        path: 'subjects',
        element: <SubjectListPage />,
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
