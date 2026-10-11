import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Question } from '../../types/question';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { formatSecondsToTime, getDifficultyColor, getTypeLabel } from '../../lib/utils';

interface ActiveQuizData {
  id: string;
  timeLimitMinutes?: number;
  questions: Question[];
}

interface RunnerProps {
  quiz: ActiveQuizData;
  quizId: string;
}

const ActiveQuizRunner: React.FC<RunnerProps> = ({ quiz, quizId }) => {
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() =>
    quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null
  );
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const formattedAnswers = Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer,
      }));

      return apiClient.post<{ attemptId: string }>(API_ENDPOINTS.quizzes.submit(quizId), {
        answers: formattedAnswers,
        durationSeconds: quiz.timeLimitMinutes
          ? quiz.timeLimitMinutes * 60 - (secondsRemaining || 0)
          : 0,
      });
    },
    onSuccess: (data) => {
      navigate(`/quizzes/${quizId}/results`, { state: { attemptId: data.attemptId } });
    },
  });

  const handleSubmitQuiz = useCallback(() => {
    setConfirmSubmitOpen(false);
    submitMutation.mutate();
  }, [submitMutation]);

  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, handleSubmitQuiz]);

  const currentQ = quiz.questions[currentIndex];
  const total = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const diffColor = getDifficultyColor(currentQ.difficulty);

  const handleAnswerChange = (val: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Session Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Practice Assessment In Progress
          </span>
          <span className="text-sm font-semibold text-slate-800">
            Question {currentIndex + 1} of {total} ({answeredCount} answered)
          </span>
        </div>

        <div className="flex items-center gap-4">
          {secondsRemaining !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                secondsRemaining < 120
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatSecondsToTime(secondsRemaining)}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmSubmitOpen(true)}
            isLoading={submitMutation.isPending}
          >
            Submit Assessment
          </Button>
        </div>
      </div>

      {/* Question Number Pills Navigation */}
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-slate-200/80">
        {quiz.questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isAnswered
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Box */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="indigo">{currentQ.subject}</Badge>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-md border uppercase font-bold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
            >
              {currentQ.difficulty}
            </span>
            <Badge variant="slate">{getTypeLabel(currentQ.type)}</Badge>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
          </span>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Topic: {currentQ.topic}
          </div>
          <p className="text-base font-semibold text-slate-900 leading-relaxed">
            {currentQ.text}
          </p>

          {/* Interactive Answer Input per Question Type */}
          {currentQ.type === 'mcq' && currentQ.options && (
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt, i) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAnswerChange(opt)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[true, false].map((val) => {
                const isSelected = answers[currentQ.id] === val;
                return (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => handleAnswerChange(val)}
                    className={`p-4 rounded-xl border text-sm font-bold transition-all text-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {val ? 'TRUE' : 'FALSE'}
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === 'fill_blank' && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Type Your Answer
              </label>
              <input
                type="text"
                value={(answers[currentQ.id] as string) || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Enter missing term..."
                className="w-full max-w-md rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {(currentQ.type === 'short_answer' || currentQ.type === 'long_answer') && (
            <div className="pt-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Written Response (Graded Manually by Teacher)
              </label>
              <textarea
                rows={currentQ.type === 'long_answer' ? 6 : 3}
                value={(answers[currentQ.id] as string) || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Write your answer clearly..."
                className="w-full rounded-lg border border-slate-300 p-3.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {currentQ.type === 'programming' && (
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Code Submission ({currentQ.programmingLanguage || 'Standard'})
                </label>
                <span className="text-[11px] text-slate-400">Manual teacher review</span>
              </div>
              <textarea
                rows={8}
                value={(answers[currentQ.id] as string) || currentQ.sampleCode || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="// Implement your code here"
                className="w-full rounded-lg border border-slate-300 p-3.5 font-mono text-xs bg-slate-900 text-slate-100 focus:border-indigo-500"
              />
            </div>
          )}
        </CardContent>

        {/* Footer Navigation */}
        <CardFooter className="justify-between bg-white border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
            disabled={currentIndex === 0}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous Question
          </Button>

          {currentIndex < total - 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentIndex((idx) => Math.min(total - 1, idx + 1))}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next Question
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setConfirmSubmitOpen(true)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Finish & Submit
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Submit Confirmation Dialog */}
      <Dialog
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Ready to Submit Assessment?"
        description={`You have completed ${answeredCount} of ${total} questions.`}
      >
        <div className="space-y-4 pt-2">
          {answeredCount < total && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>You have {total - answeredCount} unanswered questions remaining.</span>
            </div>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            Auto-graded questions will be scored immediately. Descriptive responses will be queued for teacher grading.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmSubmitOpen(false)}>
              Keep Working
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitQuiz}
              isLoading={submitMutation.isPending}
            >
              Confirm Submission
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export const ActiveQuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch quiz session from backend
  const {
    data: quiz,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ActiveQuizData>({
    queryKey: ['active-quiz', id],
    queryFn: () => apiClient.get<ActiveQuizData>(API_ENDPOINTS.quizzes.detail(id!)),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState type="card" count={1} />;

  if (isError || !quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <ErrorState
        title="Unable to Launch Quiz"
        message={error instanceof Error ? error.message : 'Failed to retrieve quiz questions from the API.'}
        onRetry={() => refetch()}
      />
    );
  }

  return <ActiveQuizRunner key={quiz.id} quiz={quiz} quizId={id!} />;
};
