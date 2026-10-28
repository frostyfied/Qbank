import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, AlertCircle, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from './useAuth';
import { useDevPreview } from '../../dev-preview/devPreviewState';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { UserRole } from '../../types/auth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const devPreview = useDevPreview();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both your university email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Capture the returned user
      const loggedInUser = await login(email, password);
      
      // Redirect based on actual role
      if (loggedInUser.role === 'admin') {
        navigate('/dashboard/admin');
      } else if (loggedInUser.role === 'teacher') {
        navigate('/dashboard/teacher');
      } else {
        navigate('/dashboard/student');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials or connection failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevPreviewEntry = (role: UserRole) => {
    devPreview.enterPreview(role);
    navigate(`/dashboard/${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to QBank
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Academic Question Bank & Assessment Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-6">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <Input
              label="University Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to Real Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Register as Student
              </Link>
            </p>
          </div>
        </div>

        {devPreview.isAvailable && (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Development Preview Mode Active
              </h3>
            </div>
            <p className="text-xs text-amber-900/80 mb-4 leading-relaxed">
              The backend is still under development. Click below to inspect role-specific UI layouts without credentials:
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDevPreviewEntry('student')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:shadow-xs transition-all text-slate-800"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="text-xs font-semibold">Student</span>
                <span className="text-[10px] text-slate-400">Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleDevPreviewEntry('teacher')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:shadow-xs transition-all text-slate-800"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-xs font-semibold">Teacher</span>
                <span className="text-[10px] text-slate-400">Hub</span>
              </button>

              <button
                type="button"
                onClick={() => handleDevPreviewEntry('admin')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:shadow-xs transition-all text-slate-800"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 mb-1" />
                <span className="text-xs font-semibold">Admin</span>
                <span className="text-[10px] text-slate-400">Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};