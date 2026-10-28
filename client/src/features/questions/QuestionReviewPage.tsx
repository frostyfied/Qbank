import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, FileQuestion, CheckSquare, Award } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Question } from '../../types/question';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { getDifficultyColor, getTypeLabel, formatDate } from '../../lib/utils';

export const QuestionReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'questions' | 'quizzes'>('quizzes');

  // Question Review State
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [feedback, setFeedback] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Quiz Grading State
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizGrades, setQuizGrades] = useState<Record<string, { marks: number; comment: string }>>({});
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);

  // Fetch Questions
  const { data: pendingQuestionsData, isLoading: isLoadingQs } = useQuery<{ questions: Question[] }>({
    queryKey: ['pending-questions'],
    queryFn: () => apiClient.get<{ questions: Question[] }>(API_ENDPOINTS.questions.pending),
  });
  const pendingQuestions = pendingQuestionsData?.questions || [];

  // Fetch Quizzes
  const { data: pendingQuizzesData, isLoading: isLoadingQuizzes } = useQuery<{ attempts: any[] }>({
    queryKey: ['pending-attempts'],
    queryFn: () => apiClient.get<{ attempts: any[] }>('/quiz-attempts/pending'),
  });
  const pendingQuizzes = pendingQuizzesData?.attempts || [];

  // Mutations
  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, feedback }: { id: string; action: 'approve' | 'reject'; feedback: string }) => {
      return apiClient.post(API_ENDPOINTS.questions.review(id), { action, feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-questions'] });
      setDialogOpen(false); setSelectedQuestion(null); setFeedback('');
    },
  });

  const gradeQuizMutation = useMutation({
    mutationFn: ({ id, grades }: { id: string; grades: any[] }) => 
      apiClient.patch(`/quiz-attempts/${id}/grade`, { grades }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-attempts'] });
      setGradeDialogOpen(false);
      setSelectedQuiz(null);
    },
  });

  const handleOpenDialog = (question: Question, action: 'approve' | 'reject') => {
    setSelectedQuestion(question); setReviewAction(action); setFeedback(''); setDialogOpen(true);
  };

  const handleOpenGrading = async (quizId: string) => {
    try {
      const res = await apiClient.get<{ attempt: any }>(API_ENDPOINTS.quizzes.attemptDetail(quizId));
      const attempt = res.attempt;
      
      setSelectedQuiz(attempt);
      
      // Initialize grades state for manual questions
      const initialGrades: Record<string, { marks: number; comment: string }> = {};
      attempt.questions.forEach((q: any) => {
        if (q.gradingStatus === 'pending_review' || q.gradingStatus === 'manual_graded') {
          initialGrades[q.questionId] = {
            marks: q.awardedMarks || 0,
            comment: q.teacherComment || '',
          };
        }
      });
      setQuizGrades(initialGrades);
      setGradeDialogOpen(true);
    } catch (err) {
      alert('Failed to load quiz details');
    }
  };

  const submitGrades = () => {
    if (!selectedQuiz) return;
    const formattedGrades = Object.entries(quizGrades).map(([questionId, data]) => ({
      questionId,
      awardedMarks: data.marks,
      teacherComment: data.comment,
    }));
    gradeQuizMutation.mutate({ id: selectedQuiz._id, grades: formattedGrades });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review Submissions</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage student question contributions and grade their practice quizzes.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'questions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Pending Questions ({pendingQuestions.length})
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'quizzes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Pending Quizzes ({pendingQuizzes.length})
        </button>
      </div>

      {/* TAB 1: PENDING QUESTIONS */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {isLoadingQs && <LoadingState type="card" count={3} />}
          {!isLoadingQs && pendingQuestions.length === 0 && (
            <EmptyState icon={<FileQuestion className="w-8 h-8 text-slate-400" />} title="Queue Clear" description="No student questions are currently awaiting review." />
          )}
          {!isLoadingQs && pendingQuestions.map((q: any) => {
            const diffColor = getDifficultyColor(q.difficulty);
            return (
              <Card key={q._id || q.id}>
                <CardHeader className="bg-slate-50 flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo">{q.subjectName || q.subject || 'General'}</Badge>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-md border uppercase font-bold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}>{q.difficulty}</span>
                    <Badge variant="slate">{getTypeLabel(q.type)}</Badge>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{q.marks} Marks</span>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Submitted by: {q.authorName}</div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">{q.text}</p>
                </CardContent>
                <CardFooter className="justify-end gap-3 pt-3 bg-white">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(q, 'reject')} className="text-rose-600" leftIcon={<XCircle className="w-4 h-4" />}>Reject</Button>
                  <Button variant="primary" size="sm" onClick={() => handleOpenDialog(q, 'approve')} leftIcon={<CheckCircle2 className="w-4 h-4" />}>Approve</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 2: PENDING QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          {isLoadingQuizzes && <LoadingState type="card" count={3} />}
          {!isLoadingQuizzes && pendingQuizzes.length === 0 && (
            <EmptyState icon={<CheckSquare className="w-8 h-8 text-slate-400" />} title="All Caught Up" description="No quiz attempts require your review right now." />
          )}
          {!isLoadingQuizzes && pendingQuizzes.map((att: any) => (
            <Card key={att._id}>
              <CardHeader className="bg-slate-50 flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="emerald">Quiz Attempt</Badge>
                  <span className="text-sm font-bold text-slate-700">{att.subjectName || 'General'}</span>
                </div>
                <span className="text-xs text-slate-500">{formatDate(att.submittedAt)}</span>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Student: {att.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">Current Score: {att.score} / {att.maxScore}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <Button variant="primary" size="sm" onClick={() => handleOpenGrading(att._id)} leftIcon={<Award className="w-4 h-4" />}>
                     Grade Quiz
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Reviewing Questions */}
      <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="Review Question">
        <div className="space-y-4 pt-2">
          <Textarea label="Feedback / Comments" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant={reviewAction === 'approve' ? 'primary' : 'danger'} size="sm" onClick={() => selectedQuestion && reviewMutation.mutate({ id: (selectedQuestion as any)._id || selectedQuestion.id, action: reviewAction, feedback })}>
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog for Grading Quizzes */}
      <Dialog 
        isOpen={gradeDialogOpen} 
        onClose={() => setGradeDialogOpen(false)} 
        title="Grade Quiz Attempt" 
        description="Review written answers and award marks."
      >
        <div className="space-y-6 pt-4 max-h-[60vh] overflow-y-auto pr-2">
          {selectedQuiz?.questions.map((q: any, idx: number) => {
            const isAutoGraded = q.gradingStatus === 'auto_graded';
            const gradeData = quizGrades[q.questionId] || { marks: 0, comment: '' };

            return (
              <div key={q.questionId} className="p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1">Question {idx + 1}</span>
                    <p className="text-sm font-semibold text-slate-900">{q.text}</p>
                  </div>
                  <Badge variant={isAutoGraded ? 'emerald' : 'amber'}>
                    {isAutoGraded ? `Auto-graded: ${q.awardedMarks}/${q.marks}` : 'Needs Grading'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="block text-xs font-semibold text-slate-400 mb-1">Student's Answer:</span>
                    <span className="text-slate-800">{String(q.userAnswer || 'No answer provided')}</span>
                  </div>
                  {isAutoGraded && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="block text-xs font-semibold text-emerald-600 mb-1">Correct Answer:</span>
                      <span className="text-emerald-900 font-medium">{String(q.correctAnswer)}</span>
                    </div>
                  )}
                </div>

                {/* Grading Inputs for Manual Questions */}
                {!isAutoGraded && (
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                    <div className="sm:col-span-3">
                      <Textarea 
                        label="Teacher Comment (Optional)" 
                        rows={2} 
                        value={gradeData.comment}
                        onChange={(e) => setQuizGrades(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], comment: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <Input 
                        label={`Marks (Max: ${q.marks})`} 
                        type="number" 
                        min={0} 
                        max={q.marks}
                        value={gradeData.marks}
                        onChange={(e) => setQuizGrades(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], marks: Number(e.target.value) } }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={submitGrades} isLoading={gradeQuizMutation.isPending}>
            Submit Final Grades
          </Button>
        </div>
      </Dialog>
    </div>
  );
};