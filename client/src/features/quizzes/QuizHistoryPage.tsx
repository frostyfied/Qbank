import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { History, Calendar, Clock, ArrowRight, Award } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { QuizAttempt } from '../../types/quiz';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { formatDate, formatSecondsToTime } from '../../lib/utils';

export const QuizHistoryPage: React.FC = () => {
  const {
    data: attempts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<QuizAttempt[]>({
    queryKey: ['quiz-attempts'],
    queryFn: () => apiClient.get<QuizAttempt[]>(API_ENDPOINTS.quizzes.attempts),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Practice History & Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review past self-assessment attempts, scores, and instructor evaluation statuses
          </p>
        </div>
        <Link to="/quizzes/setup">
          <Button variant="primary" size="sm">
            Take New Quiz
          </Button>
        </Link>
      </div>

      {isLoading && <LoadingState type="card" count={3} />}

      {isError && (
        <ErrorState
          title="History Records Unavailable"
          message={error instanceof Error ? error.message : 'Unable to retrieve quiz history from the backend.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && attempts.length === 0 && (
        <EmptyState
          icon={<History className="w-8 h-8 text-slate-400" />}
          title="No Practice Attempts Yet"
          description="You haven't completed any practice assessments yet. Customize and take your first quiz to track your mastery."
          actionLabel="Start a Practice Quiz"
          onAction={() => window.location.assign('/quizzes/setup')}
        />
      )}

      {!isLoading && !isError && attempts.length > 0 && (
        <div className="space-y-3">
          {attempts.map((att) => {
            const isPending = att.overallGradingStatus === 'pending_manual_grading';

            return (
              <Card
                key={att.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">
                        {att.subjectName || 'General Assessment'}
                      </span>
                      <Badge variant={isPending ? 'amber' : 'emerald'} size="sm">
                        {isPending ? 'Grading Pending' : 'Completed'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(att.submittedAt)}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" /> {formatSecondsToTime(att.durationSecondsTaken)}
                      </span>
                      <span>{att.totalQuestions} Questions</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-right">
                    <span className="block text-base font-extrabold text-slate-900">
                      {att.score} / {att.maxScore}
                    </span>
                    <span className="text-xs text-indigo-600 font-semibold">
                      {Math.round(att.percentage)}%
                    </span>
                  </div>
                  <Link to={`/quizzes/${att.id}/results`} state={{ attemptId: att.id }}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Review
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
