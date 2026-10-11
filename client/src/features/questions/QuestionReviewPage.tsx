import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, FileQuestion } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Question } from '../../types/question';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Textarea } from '../../components/ui/Textarea';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { getDifficultyColor, getTypeLabel } from '../../lib/utils';

export const QuestionReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [feedback, setFeedback] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: pendingQuestions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Question[]>({
    queryKey: ['pending-questions'],
    queryFn: () => apiClient.get<Question[]>(API_ENDPOINTS.questions.pending),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, feedback }: { id: string; action: 'approve' | 'reject'; feedback: string }) => {
      return apiClient.post(API_ENDPOINTS.questions.review(id), { action, feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setDialogOpen(false);
      setSelectedQuestion(null);
      setFeedback('');
    },
  });

  const handleOpenDialog = (question: Question, action: 'approve' | 'reject') => {
    setSelectedQuestion(question);
    setReviewAction(action);
    setFeedback('');
    setDialogOpen(true);
  };

  const handleConfirmReview = () => {
    if (!selectedQuestion) return;
    reviewMutation.mutate({
      id: selectedQuestion.id,
      action: reviewAction,
      feedback,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Student Question Submissions
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review, approve, or reject student contributions for inclusion in the official question bank
        </p>
      </div>

      {isLoading && <LoadingState type="card" count={3} />}

      {isError && (
        <ErrorState
          title="Failed to Load Submissions"
          message={error instanceof Error ? error.message : 'Unable to retrieve pending questions.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && pendingQuestions.length === 0 && (
        <EmptyState
          icon={<FileQuestion className="w-8 h-8 text-slate-400" />}
          title="Review Queue Clear"
          description="There are currently no student question submissions awaiting teacher review."
        />
      )}

      {!isLoading && !isError && pendingQuestions.length > 0 && (
        <div className="space-y-4">
          {pendingQuestions.map((q) => {
            const diffColor = getDifficultyColor(q.difficulty);
            return (
              <Card key={q.id} className="border-slate-200">
                <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="indigo">{q.subject}</Badge>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-md border uppercase font-bold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
                    >
                      {q.difficulty}
                    </span>
                    <Badge variant="slate">{getTypeLabel(q.type)}</Badge>
                    <Badge variant="amber">Pending Review</Badge>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Submitted by: {q.authorName || 'Student'} • Topic: {q.topic}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-3">
                    {q.text}
                  </p>

                  {q.explanation && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                      <strong>Author Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="justify-end gap-3 bg-white">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(q, 'reject')}
                    leftIcon={<XCircle className="w-4 h-4 text-rose-500" />}
                    className="text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    Reject Submission
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenDialog(q, 'approve')}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Approve & Publish
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Feedback Modal */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={reviewAction === 'approve' ? 'Approve Question Submission' : 'Reject Question Submission'}
        description={
          reviewAction === 'approve'
            ? 'This question will be published to the public QBank catalog.'
            : 'Provide constructive feedback for the submitting student.'
        }
      >
        <div className="space-y-4 pt-2">
          <Textarea
            label="Feedback / Comments for Student"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              reviewAction === 'approve'
                ? 'Optional notes or commendation...'
                : 'Explain what needs correction (e.g., unclear question prompt, incorrect solution)...'
            }
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              size="sm"
              onClick={handleConfirmReview}
              isLoading={reviewMutation.isPending}
            >
              {reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
