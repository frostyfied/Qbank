import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Sparkles, LogOut, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';
import { useDevPreview } from './devPreviewState';
import type { UserRole } from '../types/auth';

interface DevPreviewBannerProps {
  onOpenTriviaDrawer?: () => void;
}

export const DevPreviewBanner: React.FC<DevPreviewBannerProps> = ({ onOpenTriviaDrawer }) => {
  const { isAvailable, isActive, role, switchRole, exitPreview } = useDevPreview();
  const navigate = useNavigate();

  if (!isAvailable || !isActive) return null;

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    // Navigate to role-specific dashboard
    navigate(`/dashboard/${newRole}`);
  };

  const handleExit = () => {
    exitPreview();
    navigate('/login');
  };

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-medium border-b border-amber-600 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Indicator */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded font-mono font-bold tracking-wide uppercase text-[10px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Dev Preview
          </span>
          <span className="font-semibold text-slate-950 hidden sm:inline">
            Development Preview — Not Authenticated
          </span>
        </div>

        {/* Center: Role Switcher */}
        <div className="flex items-center gap-1.5 bg-amber-600/30 p-0.5 rounded-lg border border-amber-600/40">
          <span className="text-[11px] text-slate-900 font-semibold px-2">Role:</span>
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              role === 'student'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-900 hover:bg-amber-400/50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Student
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('teacher')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              role === 'teacher'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-900 hover:bg-amber-400/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Teacher
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              role === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-900 hover:bg-amber-400/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onOpenTriviaDrawer && (
            <button
              type="button"
              onClick={onOpenTriviaDrawer}
              className="flex items-center gap-1.5 bg-indigo-900 text-indigo-100 hover:bg-indigo-950 px-2.5 py-1 rounded font-medium shadow-xs transition-colors"
              title="Inspect Question Cards with external trivia data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Open Trivia Card Inspector</span>
              <span className="md:hidden">Trivia Cards</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExit}
            className="flex items-center gap-1 bg-amber-400/60 hover:bg-amber-300 text-slate-900 px-2 py-1 rounded font-semibold transition-colors"
            title="Exit preview and return to login"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
