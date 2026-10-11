import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, RotateCcw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Question, QuestionDifficulty, QuestionType } from '../../types/question';
import type { Subject } from '../../types/subject';
import { QuestionCard } from './QuestionCard';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useAuth } from '../auth/useAuth';

interface QuestionsApiResponse {
  questions: Question[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const QuestionBankPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | 'all'>('all');
  const [questionType, setQuestionType] = useState<QuestionType | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 8;

  // Query subjects for the dropdown
  const { data: subjectsData } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<Subject[]>(API_ENDPOINTS.subjects.list),
    retry: 0,
  });

  // Query questions
  const queryParams = {
    page,
    limit,
    search: search.trim() || undefined,
    subject: subject || undefined,
    semester: semester || undefined,
    difficulty: difficulty !== 'all' ? difficulty : undefined,
    type: questionType !== 'all' ? questionType : undefined,
  };

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<QuestionsApiResponse>({
    queryKey: ['questions', queryParams],
    queryFn: () => apiClient.get<QuestionsApiResponse>(API_ENDPOINTS.questions.list, queryParams),
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ id, currentlyBookmarked }: { id: string; currentlyBookmarked: boolean }) => {
      if (currentlyBookmarked) {
        return apiClient.delete(API_ENDPOINTS.bookmarks.remove(id));
      }
      return apiClient.post(API_ENDPOINTS.bookmarks.add(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  // Delete mutation (for teachers/admins)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(API_ENDPOINTS.questions.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  const handleResetFilters = () => {
    setSearch('');
    setSubject('');
    setSemester('');
    setDifficulty('all');
    setQuestionType('all');
    setPage(1);
  };

  const questions = questionsData?.questions || [];
  const pagination = questionsData?.pagination || { total: 0, page: 1, totalPages: 1 };
  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Question Bank</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse verified academic questions across semesters and disciplines
          </p>
        </div>
        <Link to="/questions/create">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            {user?.role === 'student' ? 'Submit Question' : 'Author Question'}
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search questions or tags..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            placeholder="All Subjects"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Subjects' },
              ...(subjectsData || []).map((s) => ({ value: s.name, label: s.name })),
            ]}
          />

          <Select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value as QuestionDifficulty | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Difficulties' },
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />

          <Select
            value={questionType}
            onChange={(e) => {
              setQuestionType(e.target.value as QuestionType | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Question Types' },
              { value: 'mcq', label: 'Multiple Choice (MCQ)' },
              { value: 'true_false', label: 'True / False' },
              { value: 'fill_blank', label: 'Fill in the Blank' },
              { value: 'short_answer', label: 'Short Answer' },
              { value: 'long_answer', label: 'Long Answer' },
              { value: 'programming', label: 'Programming' },
            ]}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>
              Showing {questions.length} of {pagination.total} questions
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Content Feed */}
      {isLoading && <LoadingState type="card" count={4} />}

      {isError && (
        <ErrorState
          title="Unable to Retrieve Questions"
          message={error instanceof Error ? error.message : 'Failed to connect to the QBank backend.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && questions.length === 0 && (
        <EmptyState
          title="No Questions Found"
          description={
            search || subject || difficulty !== 'all' || questionType !== 'all'
              ? 'No questions matched your search criteria. Try loosening your filters.'
              : 'The question bank is currently empty. Authors can create and publish verified questions.'
          }
          actionLabel={search || subject ? 'Clear Filters' : 'Author First Question'}
          onAction={search || subject ? handleResetFilters : undefined}
        />
      )}

      {!isLoading && !isError && questions.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                canManage={canManage}
                onBookmarkToggle={(id, cur) => bookmarkMutation.mutate({ id, currentlyBookmarked: cur })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-600 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
