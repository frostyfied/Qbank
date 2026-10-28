import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Bookmark,
  CheckSquare,
  History,
  PlusCircle,
  FileCheck2,
  Users,
  FolderTree,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import type { UserRole } from '../../types/auth';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  role?: UserRole;
  onLogout?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ role = 'student', onLogout, className = '' }) => {
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/dashboard/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'User Directory', icon: Users },
          { to: '/questions', label: 'Question Bank', icon: BookOpen },
          { to: '/questions/review', label: 'Review Submissions', icon: FileCheck2 },
          { to: '/subjects', label: 'Subject Manager', icon: FolderTree },
        ];
      case 'teacher':
        return [
          { to: '/dashboard/teacher', label: 'Teacher Dashboard', icon: LayoutDashboard },
          { to: '/questions/create', label: 'Create Question', icon: PlusCircle },
          { to: '/questions/review', label: 'Review Submissions', icon: FileCheck2 },
          { to: '/subjects', label: 'Subjects & Topics', icon: FolderTree },
          // Question Bank and Bookmarks REMOVED for teacher
        ];
      case 'student':
      default:
        return [
          { to: '/dashboard/student', label: 'My Dashboard', icon: LayoutDashboard },
          { to: '/questions', label: 'Question Bank', icon: BookOpen },
          { to: '/quizzes/setup', label: 'Practice Quiz', icon: CheckSquare },
          { to: '/quizzes/history', label: 'Quiz History', icon: History },
          { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
        ];
    }
  };

  const navLinks = getNavLinks();

  const roleBadgeVariants: Record<UserRole, 'indigo' | 'emerald' | 'amber'> = {
    student: 'indigo',
    teacher: 'emerald',
    admin: 'amber',
  };

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-full select-none ${className}`}
    >
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-none">
                QBank
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Academic System
              </span>
            </div>
          </div>
          <Badge variant={roleBadgeVariants[role]} size="sm">
            {role}
          </Badge>
        </div>

        <nav className="p-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};