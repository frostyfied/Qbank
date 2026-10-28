import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import { QuestionCard } from '../questions/QuestionCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';

export const BookmarksPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch bookmarks from backend
  const { data, isLoading, isError, error, refetch } = useQuery<{ bookmarks: any[] }>({
    queryKey: ['bookmarks'],
    queryFn: () => apiClient.get<{ bookmarks: any[] }>(API_ENDPOINTS.bookmarks.list),
  });

  // Mutation to remove a bookmark directly from this page
  const removeMutation = useMutation({
    mutationFn: (questionId: string) => apiClient.delete(API_ENDPOINTS.bookmarks.remove(questionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  if (isLoading) return <LoadingState type="card" count={3} />;

  if (isError) {
    return (
      <ErrorState
        title="Failed to load bookmarks"
        message={error instanceof Error ? error.message : 'Please try again.'}
        onRetry={() => refetch()}
      />
    );
  }

  const bookmarks = data?.bookmarks || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Bookmarks</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quickly review the questions you have saved for later.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-slate-400" />}
          title="No bookmarked questions yet"
          description="Click the bookmark icon on any question in the Question Bank to save it here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookmarks.map((b) => {
            // The backend returns { _id: bookmarkId, question: { ...questionData } }
            const q = b.question;
            const qId = q._id || q.id;

            return (
              <QuestionCard
                key={b._id}
                question={q}
                // Clicking the golden bookmark here removes it
                onBookmarkToggle={() => removeMutation.mutate(qId)} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
};