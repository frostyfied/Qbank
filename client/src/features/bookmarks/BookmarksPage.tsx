import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Question } from '../../types/question';
import { QuestionCard } from '../questions/QuestionCard';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';

export const BookmarksPage: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: bookmarks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Question[]>({
    queryKey: ['bookmarks'],
    queryFn: () => apiClient.get<Question[]>(API_ENDPOINTS.bookmarks.list),
  });

  const unbookmarkMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(API_ENDPOINTS.bookmarks.remove(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Saved Bookmarks</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly reference saved questions for revision and exam prep
          </p>
        </div>
        <Link to="/questions">
          <Button variant="outline" size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
            Browse More Questions
          </Button>
        </Link>
      </div>

      {isLoading && <LoadingState type="card" count={3} />}

      {isError && (
        <ErrorState
          title="Bookmarks Unavailable"
          message={error instanceof Error ? error.message : 'Failed to retrieve bookmarked questions.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && bookmarks.length === 0 && (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-slate-400" />}
          title="No Bookmarked Questions"
          description="You haven't bookmarked any questions yet. Click the bookmark icon on any question in the catalog to save it here."
          actionLabel="Explore Question Bank"
          onAction={() => window.location.assign('/questions')}
        />
      )}

      {!isLoading && !isError && bookmarks.length > 0 && (
        <div className="space-y-4">
          {bookmarks.map((q) => (
            <QuestionCard
              key={q.id}
              question={{ ...q, isBookmarked: true }}
              onBookmarkToggle={(id) => unbookmarkMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
