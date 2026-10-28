import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { History, Calendar, ArrowRight, Award, RotateCcw } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { QuizAttempt } from '../../types/quiz';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { formatDate } from '../../lib/utils';

export const QuizHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: attemptsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<{ attempts: QuizAttempt[] }>({
    queryKey: ['quiz-attempts'],
    queryFn: () => apiClient.get<{ attempts: QuizAttempt[] }>(API_ENDPOINTS.quizzes.attempts),
  });

  // Mutation to instantly redo the quiz with the same parameters
  const redoMutation = useMutation({
    mutationFn: async (attempt: any) => {
      return apiClient.post<{ quizId: string }>(API_ENDPOINTS.quizzes.generate, {
        subjectId: attempt.subjectId,
        difficulty: attempt.difficulty,
        count: attempt.totalQuestions,
      });
    },
    onSuccess: (data) => {
      navigate(`/quizzes/${data.quizId}`);
    },
  });

  const attempts = attemptsResponse?.attempts || [];

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
          message={error instanceof Error ? error.message : 'Unable to retrieve quiz history.'}
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
          {attempts.map((att: any) => {
            const isPending = att.overallGradingStatus === 'pending_manual_grading';
            const attId = att._id || att.id;

            return (
              <Card
                key={attId}
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
                      <span>{att.totalQuestions} Questions</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-right">
                    <span className="block text-base font-extrabold text-slate-900">
                      {att.score} / {att.maxScore}
                    </span>
                    <span className="text-xs text-indigo-600 font-semibold">
                      {Math.round(att.percentage)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/quizzes/${attId}/results`} state={{ attemptId: attId }}>
                      <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Review
                      </Button>
                    </Link>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                      onClick={() => redoMutation.mutate(att)}
                      isLoading={redoMutation.isPending}
                    >
                      Redo Quiz
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};