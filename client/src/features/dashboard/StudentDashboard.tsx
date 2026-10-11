import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckSquare, Bookmark, History, ArrowRight, Award, PlusCircle } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { QuizAttempt } from '../../types/quiz';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatDate } from '../../lib/utils';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch recent attempts
  const { data: recentAttempts = [], isLoading, isError } = useQuery<QuizAttempt[]>({
    queryKey: ['recent-quiz-attempts'],
    queryFn: () => apiClient.get<QuizAttempt[]>(API_ENDPOINTS.quizzes.attempts, { limit: 3 }),
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-md shadow-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">
            Student Portal
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            Welcome back, {user?.name || 'Student'}!
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl leading-relaxed">
            Ready to study? Browse through faculty-curated questions or practice self-paced quizzes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/quizzes/setup">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<CheckSquare className="w-4 h-4" />}
              className="bg-white text-indigo-900 hover:bg-indigo-50 shadow-xs"
            >
              Start Practice Quiz
            </Button>
          </Link>
          <Link to="/questions/create">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4 text-white" />}
              className="text-white hover:bg-white/10"
            >
              Submit Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/questions" className="block group">
          <Card className="p-5 h-full group-hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Question Bank
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Explore university questions with topic filters, difficulty tags, and marking schemes.
            </p>
          </Card>
        </Link>

        <Link to="/bookmarks" className="block group">
          <Card className="p-5 h-full group-hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Bookmark className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              My Bookmarks
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Review difficult questions you saved during your revision sessions.
            </p>
          </Card>
        </Link>

        <Link to="/quizzes/history" className="block group">
          <Card className="p-5 h-full group-hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <History className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Attempt Records
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              View your quiz attempts history, scores, and faculty grading evaluations.
            </p>
          </Card>
        </Link>
      </div>

      {/* Recent Activity Widget */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/60 border-b border-slate-100">
          <CardTitle className="text-sm font-bold">Recent Practice Attempts</CardTitle>
          <Link
            to="/quizzes/history"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading && (
            <p className="text-xs text-slate-500 py-4 text-center">Loading attempts from server...</p>
          )}
          {isError && (
            <p className="text-xs text-rose-500 py-4 text-center">
              Unable to reach backend for attempt records.
            </p>
          )}
          {!isLoading && !isError && recentAttempts.length === 0 && (
            <div className="text-center py-6">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No practice attempts recorded yet.</p>
              <Link to="/quizzes/setup" className="inline-block mt-3">
                <Button variant="outline" size="sm">
                  Take Your First Quiz
                </Button>
              </Link>
            </div>
          )}
          {!isLoading && !isError && recentAttempts.length > 0 && (
            <div className="divide-y divide-slate-100">
              {recentAttempts.map((att) => (
                <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {att.subjectName || 'Practice Quiz'}
                    </span>
                    <span className="text-slate-400 text-[11px]">{formatDate(att.submittedAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">
                      {att.score} / {att.maxScore} ({Math.round(att.percentage)}%)
                    </span>
                    <Badge variant={att.overallGradingStatus === 'completed' ? 'emerald' : 'amber'} size="sm">
                      {att.overallGradingStatus === 'completed' ? 'Graded' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
