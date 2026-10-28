import React from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { UserRole } from '../../types/auth';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  role?: UserRole;
  onLogout?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, role, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-10 w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col">
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-full" onClick={onClose}>
          <Sidebar role={role} onLogout={onLogout} className="w-full border-r-0" />
        </div>
      </div>
    </div>
  );
};
