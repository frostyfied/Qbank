import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Bookmark, History, Play, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { QuizAttempt } from '../../types/quiz';
import { formatDate } from '../../lib/utils';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: attemptsResponse } = useQuery<{ attempts: QuizAttempt[] }>({
    queryKey: ['quiz-attempts'],
    queryFn: () => apiClient.get<{ attempts: QuizAttempt[] }>(API_ENDPOINTS.quizzes.attempts),
  });

  const recentAttempts = (attemptsResponse?.attempts || []).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-indigo-600 rounded-2xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest block mb-2">
            Student Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-indigo-100 text-sm mb-6 max-w-lg leading-relaxed">
            Ready to study? Browse through faculty-curated questions or practice self-paced quizzes to boost your confidence.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/quizzes/setup">
              <Button variant="secondary" size="md" leftIcon={<Play className="w-4 h-4 fill-current" />}>
                Start Practice Quiz
              </Button>
            </Link>
            {/* REMOVED SUBMIT QUESTION BUTTON HERE */}
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/questions">
          <Card className="p-6 h-full hover:border-indigo-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Question Bank</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore university questions with topic filters, difficulty tags, and marking schemes.
            </p>
          </Card>
        </Link>

        <Link to="/bookmarks">
          <Card className="p-6 h-full hover:border-amber-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bookmark className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">My Bookmarks</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review difficult questions you saved during your revision sessions.
            </p>
          </Card>
        </Link>

        <Link to="/quizzes/history">
          <Card className="p-6 h-full hover:border-emerald-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <History className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Attempt Records</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              View your quiz attempts history, scores, and faculty grading evaluations.
            </p>
          </Card>
        </Link>
      </div>

      {/* Recent Practice Attempts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Practice Attempts</h2>
          <Link to="/quizzes/history" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentAttempts.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-slate-300">
            <p className="text-sm text-slate-500">You haven't taken any practice quizzes yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentAttempts.map((att: any) => {
              const attId = att._id || att.id;
              return (
                <Card key={attId} className="p-4 flex items-center justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      {att.subjectName || 'General Assessment'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(att.submittedAt)} • {att.totalQuestions} Questions
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={att.overallGradingStatus === 'pending_manual_grading' ? 'amber' : 'emerald'}>
                      {att.score} / {att.maxScore}
                    </Badge>
                    <Link to={`/quizzes/${attId}/results`} state={{ attemptId: attId }}>
                      <Button variant="outline" size="sm">Review</Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};