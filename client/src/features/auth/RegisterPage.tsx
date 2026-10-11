import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { useAuth } from './useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Student Account
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Join QBank to browse verified questions and practice quizzes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="University Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@university.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <p className="text-[11px] text-slate-400 leading-normal">
              Note: Public registration assigns student access. Faculty and Administrator accounts are assigned by university management.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Complete Registration
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
