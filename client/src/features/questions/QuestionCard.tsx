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
        return 'emerald';
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

  return (
    <Card className="hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Header Metadata */}
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo">{question.subject}</Badge>
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
                onClick={() => onBookmarkToggle(question.id, !!question.isBookmarked)}
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
                  to={`/questions/${question.id}/edit`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Edit Question"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(question.id)}
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
            Topic: {question.topic}
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-4">
            {question.text}
          </p>

          {/* Type-Specific Display Preview */}
          {question.type === 'mcq' && question.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
              {question.options.map((opt, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="truncate">{opt}</span>
                </div>
              ))}
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

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Explanation if authorized */}
          {showExplanation && question.explanation && (
            <div className="mt-4 p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
              <span className="font-bold flex items-center gap-1 text-indigo-700 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reference Explanation:
              </span>
              {question.explanation}
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
          to={`/questions/${question.id}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
        >
          Details
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardFooter>
    </Card>
  );
};
