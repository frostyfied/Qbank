import { useState, useEffect } from 'react';
import type { User, UserRole } from '../types/auth';

export const isDevPreviewAvailable = (): boolean => {
  return (
    import.meta.env.DEV === true &&
    import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'
  );
};

const STORAGE_KEY_ROLE = 'qbank_dev_preview_role';
const STORAGE_KEY_ACTIVE = 'qbank_dev_preview_active';

export function getInitialPreviewRole(): UserRole {
  if (typeof window === 'undefined') return 'student';
  const saved = sessionStorage.getItem(STORAGE_KEY_ROLE) as UserRole | null;
  return saved && ['student', 'teacher', 'admin'].includes(saved) ? saved : 'student';
}

export function isPreviewActive(): boolean {
  if (!isDevPreviewAvailable()) return false;
  return sessionStorage.getItem(STORAGE_KEY_ACTIVE) === 'true';
}

export function setPreviewActive(active: boolean, role: UserRole = 'student') {
  if (active) {
    sessionStorage.setItem(STORAGE_KEY_ACTIVE, 'true');
    sessionStorage.setItem(STORAGE_KEY_ROLE, role);
  } else {
    sessionStorage.removeItem(STORAGE_KEY_ACTIVE);
    sessionStorage.removeItem(STORAGE_KEY_ROLE);
  }
}

export function createPreviewUser(role: UserRole): User {
  const roleNames = {
    student: 'Preview Student',
    teacher: 'Preview Teacher',
    admin: 'Preview Administrator',
  };

  return {
    id: `dev-preview-${role}`,
    name: roleNames[role],
    email: `${role}.preview@university.local`,
    role,
  };
}

// Simple event-driven listener for dev preview updates across components
type Listener = () => void;
const listeners = new Set<Listener>();

export function notifyDevPreviewChange() {
  listeners.forEach((fn) => fn());
}

export function useDevPreview() {
  const isAvailable = isDevPreviewAvailable();
  const [active, setActive] = useState<boolean>(() => isPreviewActive());
  const [role, setRole] = useState<UserRole>(() => getInitialPreviewRole());
  const [triviaDrawerOpen, setTriviaDrawerOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setActive(isPreviewActive());
      setRole(getInitialPreviewRole());
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const switchRole = (newRole: UserRole) => {
    sessionStorage.setItem(STORAGE_KEY_ROLE, newRole);
    setRole(newRole);
    notifyDevPreviewChange();
  };

  const enterPreview = (newRole: UserRole = 'student') => {
    setPreviewActive(true, newRole);
    setActive(true);
    setRole(newRole);
    notifyDevPreviewChange();
  };

  const exitPreview = () => {
    setPreviewActive(false);
    setActive(false);
    notifyDevPreviewChange();
  };

  return {
    isAvailable,
    isActive: active,
    role,
    switchRole,
    enterPreview,
    exitPreview,
    triviaDrawerOpen,
    setTriviaDrawerOpen,
    previewUser: active ? createPreviewUser(role) : null,
  };
}
