import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { QuizAttempt } from '../../types/quiz';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { formatSecondsToTime } from '../../lib/utils';

export const QuizResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const attemptId = (location.state as { attemptId?: string })?.attemptId || id;

  const {
    data: attempt,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<QuizAttempt>({
    queryKey: ['quiz-attempt', attemptId],
    queryFn: () => apiClient.get<QuizAttempt>(API_ENDPOINTS.quizzes.attemptDetail(attemptId!)),
    enabled: !!attemptId,
  });

  if (isLoading) return <LoadingState type="card" count={1} />;

  if (isError || !attempt) {
    return (
      <div className="space-y-4">
        <Link to="/quizzes/history">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Quiz History
          </Button>
        </Link>
        <ErrorState
          title="Results Unavailable"
          message={error instanceof Error ? error.message : 'Unable to retrieve attempt results from the backend.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isPendingManual = attempt.overallGradingStatus === 'pending_manual_grading';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard/student">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Dashboard
          </Button>
        </Link>
        <Link to="/quizzes/setup">
          <Button variant="primary" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />}>
            Start New Quiz
          </Button>
        </Link>
      </div>

      {/* Score Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Assessment Summary
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold text-slate-900">{attempt.score}</span>
              <span className="text-base text-slate-500 font-medium">/ {attempt.maxScore} Marks</span>
              <Badge variant="indigo" className="ml-2">
                {Math.round(attempt.percentage)}%
              </Badge>
            </div>
            {isPendingManual && (
              <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Includes written questions awaiting teacher review
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-8 text-xs text-slate-500">
          <div>
            <span className="block text-slate-400 font-medium">Duration Taken</span>
            <strong className="text-slate-800 text-sm font-mono">
              {formatSecondsToTime(attempt.durationSecondsTaken || 0)}
            </strong>
          </div>
          <div>
            <span className="block text-slate-400 font-medium">Total Questions</span>
            <strong className="text-slate-800 text-sm font-mono">
              {attempt.totalQuestions}
            </strong>
          </div>
        </div>
      </div>

      {/* Question by Question Breakdown */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Detailed Answer Review</h3>

        {attempt.questions && attempt.questions.length > 0 ? (
          attempt.questions.map((item, idx) => {
            const isAuto = item.gradingStatus === 'auto_graded';
            const isCorrect = item.isCorrect;

            return (
              <Card key={idx} className="border-slate-200">
                <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Question {idx + 1}</span>
                    <Badge variant={isAuto ? (isCorrect ? 'emerald' : 'rose') : 'amber'}>
                      {isAuto ? (isCorrect ? 'Correct' : 'Incorrect') : 'Manual Grading Pending'}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    Awarded: {item.awardedMarks ?? (isCorrect ? item.question.marks : 0)} / {item.question.marks} Marks
                  </span>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {item.question.text}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="block text-slate-400 font-medium mb-1">Your Submitted Response:</span>
                      <strong className="text-slate-800 font-mono">
                        {String(item.userAnswer ?? 'No response submitted')}
                      </strong>
                    </div>

                    {isAuto && item.correctAnswer !== undefined && (
                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                        <span className="block text-emerald-700 font-medium mb-1">Correct Answer:</span>
                        <strong className="font-mono">{String(item.correctAnswer)}</strong>
                      </div>
                    )}
                  </div>

                  {item.question.explanation && (
                    <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                      <strong>Solution Note:</strong> {item.question.explanation}
                    </div>
                  )}

                  {item.teacherFeedback && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <strong>Teacher Feedback:</strong> {item.teacherFeedback}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-xs text-slate-500">Question details will appear once loaded by the API.</p>
        )}
      </div>
    </div>
  );
};
