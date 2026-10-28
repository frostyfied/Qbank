import React from 'react';
import { Bookmark, CheckCircle2, Code2, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Question } from '../../types/question';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { getDifficultyColor, getTypeLabel } from '../../lib/utils';

export interface QuestionCardProps {
  question: Question;
  onBookmarkToggle?: (id: string, currentlyBookmarked: boolean) => void;
  onDelete?: (id: string) => void;
  canManage?: boolean;
  showExplanation?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onBookmarkToggle,
  onDelete,
  canManage = false,
  showExplanation = false,
}) => {
  const diffColor = getDifficultyColor(question.difficulty);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return 'emerald';
      case 'pending':
        return 'amber';
      case 'rejected':
        return 'rose';
      default:
        return 'slate';
    }
  };

  const questionId = (question as any)._id || question.id;
  
  // Hide the demo-seed tag from the UI
  const displayTags = (question.tags || []).filter(t => !t.includes('demo-seed'));
  
  // Get correct answer if it exists
  const correctAnswer = (question as any).correctAnswer;

  return (
    <Card className="hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Header Metadata */}
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo">{question.subjectName || (question as any).subject || 'General'}</Badge>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-md border uppercase font-bold tracking-wider ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
            >
              {question.difficulty}
            </span>
            <Badge variant="slate">{getTypeLabel(question.type)}</Badge>
            {question.semester && (
              <Badge variant="sky">Sem {question.semester}</Badge>
            )}
            {question.status && question.status !== 'published' && (
              <Badge variant={getStatusBadgeVariant(question.status)}>
                {question.status}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onBookmarkToggle && (
              <button
                type="button"
                onClick={() => onBookmarkToggle(questionId, !!question.isBookmarked)}
                className={`p-1.5 rounded-lg transition-colors ${
                  question.isBookmarked
                    ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title={question.isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                aria-label="Toggle Bookmark"
              >
                <Bookmark className={`w-4 h-4 ${question.isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}

            {canManage && (
              <>
                <Link
                  to={`/questions/${questionId}/edit`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Edit Question"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(questionId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </CardHeader>

        {/* Question Prompt */}
        <CardContent className="pt-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Topic: {question.topic || 'General'}
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-4">
            {question.text}
          </p>

          {/* ONE-LINE ANSWER PREVIEW (For MCQs, T/F, Fill in blank) */}
          {correctAnswer && ['mcq', 'true_false', 'fill_blank'].includes(question.type) && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-900 font-medium">
                Answer: <strong className="font-bold">{String(correctAnswer)}</strong>
              </span>
            </div>
          )}

          {question.type === 'programming' && question.sampleCode && (
            <div className="my-3 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-2 pb-1 border-b border-slate-800">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Language: {question.programmingLanguage || 'Generic'}</span>
              </div>
              <pre>{question.sampleCode}</pre>
            </div>
          )}

          {/* Tags (filtered) */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      {/* Footer */}
      <CardFooter className="justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}</span>
          {question.authorName && (
            <span className="text-[11px] text-slate-400">By {question.authorName}</span>
          )}
        </div>
        <Link
          to={`/questions/${questionId}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
        >
          Details
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardFooter>
    </Card>
  );
};