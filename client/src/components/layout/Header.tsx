import React from 'react';
import { Menu, User as UserIcon } from 'lucide-react';
import type { User } from '../../types/auth';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  user: User | null;
  onOpenMobileNav: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenMobileNav, title = 'Question Bank' }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-full py-1 pl-2.5 pr-3 shadow-xs">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">
                {user.name}
              </span>
            </div>
            <Badge variant="slate" size="sm" className="hidden md:inline-flex">
              {user.role}
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
};
