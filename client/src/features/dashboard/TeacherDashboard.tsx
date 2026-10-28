import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, FileCheck2, ArrowRight, FolderTree } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Question } from '../../types/question';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch pending questions for review
  const { data: pendingQuestions = [], isLoading, isError } = useQuery<Question[]>({
    queryKey: ['pending-questions-count'],
    queryFn: () => apiClient.get<Question[]>(API_ENDPOINTS.questions.pending),
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-md shadow-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200">
            Faculty Portal
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            Welcome, Professor {user?.name || ''}!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl leading-relaxed">
            Manage course questions, author multi-tier assessment items, and review student contributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/questions/create">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="bg-white text-emerald-950 hover:bg-emerald-50 shadow-xs"
            >
              Author New Question
            </Button>
          </Link>
          <Link to="/questions/review">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<FileCheck2 className="w-4 h-4 text-white" />}
              className="text-white hover:bg-white/10"
            >
              Review Submissions ({pendingQuestions.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/questions/create" className="block group">
          <Card className="p-5 h-full group-hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <PlusCircle className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Author Questions
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create MCQs, programming exercises, or descriptive questions with live card preview.
            </p>
          </Card>
        </Link>

        <Link to="/questions/review" className="block group">
          <Card className="p-5 h-full group-hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Review Queue
              </CardTitle>
              {pendingQuestions.length > 0 && (
                <Badge variant="amber" size="sm">
                  {pendingQuestions.length} Pending
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Examine student-submitted questions, provide feedback, and approve for publication.
            </p>
          </Card>
        </Link>

        <Link to="/subjects" className="block group">
          <Card className="p-5 h-full group-hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <FolderTree className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
              Subject Curriculum
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Browse semester-wise syllabus modules and verify question coverage across topics.
            </p>
          </Card>
        </Link>
      </div>

      {/* Review Queue Preview */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/60 border-b border-slate-100">
          <CardTitle className="text-sm font-bold">Submissions Awaiting Verification</CardTitle>
          <Link
            to="/questions/review"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Open Review Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading && (
            <p className="text-xs text-slate-500 py-4 text-center">Checking submissions queue...</p>
          )}
          {isError && (
            <p className="text-xs text-rose-500 py-4 text-center">
              Unable to reach backend API for pending submissions.
            </p>
          )}
          {!isLoading && !isError && pendingQuestions.length === 0 && (
            <p className="text-xs text-slate-500 py-4 text-center">
              No student submissions currently awaiting review.
            </p>
          )}
          {!isLoading && !isError && pendingQuestions.length > 0 && (
            <div className="divide-y divide-slate-100">
              {pendingQuestions.slice(0, 3).map((q) => (
                <div key={q.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="max-w-xl">
                    <span className="font-semibold text-slate-800 block truncate">{q.text}</span>
                    <span className="text-slate-400 text-[11px]">
                      By {q.authorName || 'Student'} • {q.subject}
                    </span>
                  </div>
                  <Link to="/questions/review">
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
