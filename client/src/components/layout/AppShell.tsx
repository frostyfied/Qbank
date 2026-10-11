import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../features/auth/useAuth';
import { DevPreviewBanner } from '../../dev-preview/DevPreviewBanner';
import { DevTriviaDrawer } from '../../dev-preview/DevTriviaDrawer';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [triviaDrawerOpen, setTriviaDrawerOpen] = useState(false);
  const location = useLocation();

  // Determine current page title based on route
  const getPageTitle = (path: string): string => {
    if (path.includes('/dashboard/student')) return 'Student Learning Portal';
    if (path.includes('/dashboard/teacher')) return 'Teacher Management Hub';
    if (path.includes('/dashboard/admin')) return 'System Administration';
    if (path.includes('/questions/create')) return 'Author Question';
    if (path.includes('/questions/review')) return 'Submission Review Queue';
    if (path.includes('/questions/')) return 'Question Specifications';
    if (path.includes('/questions')) return 'Central Question Bank';
    if (path.includes('/quizzes/setup')) return 'Practice Quiz Configuration';
    if (path.includes('/quizzes/history')) return 'Attempt History & Records';
    if (path.includes('/quizzes/')) return 'Active Practice Assessment';
    if (path.includes('/bookmarks')) return 'Saved Question Bookmarks';
    if (path.includes('/subjects')) return 'Curriculum & Subjects';
    if (path.includes('/admin/users')) return 'User & Role Directory';
    return 'QBank System';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* ⭐️ DEV PREVIEW INTEGRATION POINT 1 (Easy to remove) */}
      <DevPreviewBanner onOpenTriviaDrawer={() => setTriviaDrawerOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Persistent Sidebar */}
        <div className="hidden lg:block h-[calc(100vh-theme(spacing.10))] sticky top-0">
          <Sidebar role={user?.role} onLogout={logout} />
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          role={user?.role}
          onLogout={logout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header
            user={user}
            title={getPageTitle(location.pathname)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ⭐️ DEV PREVIEW INTEGRATION POINT 2 (Easy to remove) */}
      <DevTriviaDrawer
        isOpen={triviaDrawerOpen}
        onClose={() => setTriviaDrawerOpen(false)}
      />
    </div>
  );
};
