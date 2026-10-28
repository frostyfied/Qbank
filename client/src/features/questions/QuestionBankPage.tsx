import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, RotateCcw, Plus, ChevronLeft, ChevronRight, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Question, QuestionDifficulty, QuestionType } from '../../types/question';
import type { Subject } from '../../types/subject';
import { QuestionCard } from './QuestionCard';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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

  const isStudent = user?.role === 'student';

  // Fetch subjects
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<Subject[]>(API_ENDPOINTS.subjects.list),
    retry: 0,
  });

  const safeSubjects = Array.isArray(subjectsData) ? subjectsData : [];

  const queryParams = {
    page,
    limit,
    search: search.trim() || undefined,
    subject: subject || undefined,
    semester: semester || undefined,
    difficulty: difficulty !== 'all' ? difficulty : undefined,
    type: questionType !== 'all' ? questionType : undefined,
  };

  // Fetch questions (only if a subject is selected, or searching, OR if user is teacher/admin)
  const isReadyToFetch = !isStudent || Boolean(subject) || Boolean(search.trim());

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<QuestionsApiResponse>({
    queryKey: ['questions', queryParams],
    queryFn: () => apiClient.get<QuestionsApiResponse>(API_ENDPOINTS.questions.list, queryParams),
    enabled: isReadyToFetch,
  });

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

  // ---------------------------------------------------------
  // VIEW 1: STUDENT SUBJECT GRID (Curriculum View)
  // ---------------------------------------------------------
  if (isStudent && !subject && !search.trim()) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Curriculum & Subjects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a subject to browse its specific question bank and start studying.
          </p>
        </div>

        {isLoadingSubjects ? (
          <LoadingState type="card" count={4} />
        ) : safeSubjects.length === 0 ? (
          <EmptyState title="No Subjects Found" description="There are no subjects available in the system yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeSubjects.map((s) => (
              <button
                key={s._id}
                onClick={() => setSubject(s.name)}
                className="text-left bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="indigo" className="font-mono">{s.code}</Badge>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Sem {s.semester}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {s.description || 'No description provided for this course.'}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {s.topics?.length || 0} Topics
                  </span>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Questions <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------
  // VIEW 2: QUESTION BANK LIST (For Teachers, or after Student selects a subject)
  // ---------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {isStudent && subject ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setSubject('')} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                Back to Subjects
              </Button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{subject}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Showing questions for this subject</p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Question Bank</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage and browse academic questions across semesters and disciplines
              </p>
            </>
          )}
        </div>
        
        {canManage && (
          <Link to="/questions/create">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Author Question
            </Button>
          </Link>
        )}
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

          {/* Only show Subject dropdown for Teachers (Students are locked to the selected subject) */}
          {!isStudent && (
            <Select
              placeholder="All Subjects"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Subjects' },
                ...safeSubjects.map((s) => ({ value: s.name, label: s.name })),
              ]}
            />
          )}

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
            <span>Showing {questions.length} of {pagination.total} questions</span>
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
          description="No questions matched your search criteria. Try loosening your filters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      )}

      {!isLoading && !isError && questions.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q: any) => (
              <QuestionCard
                key={q._id || q.id}
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