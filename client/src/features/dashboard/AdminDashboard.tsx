import React from 'react';
import { Link } from 'react-router-dom';
import { Users, FolderTree, BookOpen, Database } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-md shadow-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
            System Administration
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            QBank Administrative Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Welcome, {user?.name || 'Administrator'}. Oversee university users, curriculum structure, and question governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/users">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Users className="w-4 h-4" />}
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-xs"
            >
              Manage Users & Roles
            </Button>
          </Link>
          <Link to="/subjects">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<FolderTree className="w-4 h-4 text-white" />}
              className="text-white hover:bg-white/10"
            >
              Curriculum Modules
            </Button>
          </Link>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/users" className="block group">
          <Card className="p-5 h-full group-hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              User Directory & Roles
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Audit registered students, promote faculty accounts, and grant administrative permissions.
            </p>
          </Card>
        </Link>

        <Link to="/subjects" className="block group">
          <Card className="p-5 h-full group-hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <FolderTree className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Curriculum & Subjects
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create academic disciplines, map course codes, and organize syllabus topic modules.
            </p>
          </Card>
        </Link>

        <Link to="/questions" className="block group">
          <Card className="p-5 h-full group-hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Question Catalog Audit
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inspect all university questions, review deleted records, and verify academic standards.
            </p>
          </Card>
        </Link>
      </div>

      {/* System Status Information */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            Backend Connection & Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            • <strong>Target API Endpoint:</strong>{' '}
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}
            </code>
          </p>
          <p>
            • <strong>Authentication Mode:</strong> JWT over HTTP-only SameSite cookies with credentials enabled.
          </p>
          <p>
            • <strong>Development Preview:</strong>{' '}
            {import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true' ? (
              <span className="text-amber-600 font-semibold">Active (Development-only bypass enabled)</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Live Mode (Real backend authentication required)</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
