import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Award, BookOpen, Layers, CheckCircle2, Info } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Question } from '../../types/question';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { getDifficultyColor, getTypeLabel, formatDate } from '../../lib/utils';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: questionResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<{ question: Question }>({
    queryKey: ['question', id],
    queryFn: () => apiClient.get<{ question: Question }>(API_ENDPOINTS.questions.detail(id!)),
    enabled: !!id,
  });

  const question = questionResponse?.question;

  if (isLoading) return <LoadingState type="card" count={1} />;

  if (isError || !question) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <ErrorState
          title="Question Not Found"
          message={error instanceof Error ? error.message : 'Unable to retrieve question details.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const diffColor = getDifficultyColor(question.difficulty);
  const displaySubject = question.subjectName || (question as any).subject || 'General';
  const correctAnswer = (question as any).correctAnswer;
  
  // Hide demo-seed tags
  const displayTags = (question.tags || []).filter(t => !t.includes('demo-seed'));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Question Bank
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="indigo">{displaySubject}</Badge>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-md border uppercase font-bold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
          >
            {question.difficulty}
          </span>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-4 h-4 text-indigo-500" />
              Topic: <strong className="text-slate-800">{question.topic || 'General'}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-4 h-4 text-sky-500" />
              Semester: <strong className="text-slate-800">{question.semester}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-4 h-4 text-amber-500" />
              Marks: <strong className="text-slate-800">{question.marks}</strong>
            </span>
          </div>
          <Badge variant="slate">{getTypeLabel(question.type)}</Badge>
        </div>

        {/* Question Text */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Question Statement
            </h3>
            <p className="text-lg font-semibold text-slate-900 leading-relaxed">
              {question.text}
            </p>
          </div>

          {/* PROMINENT ANSWER BOX */}
          {correctAnswer && ['mcq', 'true_false', 'fill_blank'].includes(question.type) && (
            <div className="p-5 rounded-xl bg-emerald-500 shadow-sm space-y-1">
              <h4 className="text-xs font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Correct Answer
              </h4>
              <p className="text-xl font-bold text-white tracking-wide">
                {String(correctAnswer)}
              </p>
            </div>
          )}

          {/* Detailed Explanation Box */}
          {question.explanation && (
            <div className="p-5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Explanation
              </h4>
              <p className="text-sm text-indigo-950/90 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Classification Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Created {formatDate(question.createdAt)}
            </span>
            {question.authorName && <span>Author: {question.authorName}</span>}
          </div>
          <Link to="/quizzes/setup">
            <Button variant="primary" size="sm">
              Practice This Topic
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};