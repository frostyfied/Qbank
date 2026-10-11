import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderTree, Plus, Layers } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Subject } from '../../types/subject';
import { useAuth } from '../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';

export const SubjectListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semester, setSemester] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [topicsString, setTopicsString] = useState('');

  const {
    data: subjects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<Subject[]>(API_ENDPOINTS.subjects.list),
  });

  const createSubjectMutation = useMutation({
    mutationFn: async () => {
      const parsedTopics = topicsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      return apiClient.post(API_ENDPOINTS.subjects.create, {
        name,
        code,
        semester: Number(semester),
        description,
        topics: parsedTopics,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setDialogOpen(false);
      setName('');
      setCode('');
      setDescription('');
      setTopicsString('');
    },
  });

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    createSubjectMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Academic Curriculum & Subjects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse subjects, course modules, and syllabus topics mapped to the question bank
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDialogOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Subject Module
          </Button>
        )}
      </div>

      {isLoading && <LoadingState type="card" count={3} />}

      {isError && (
        <ErrorState
          title="Subjects Unavailable"
          message={error instanceof Error ? error.message : 'Unable to retrieve subject curriculum.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && subjects.length === 0 && (
        <EmptyState
          icon={<FolderTree className="w-8 h-8 text-slate-400" />}
          title="No Subjects Registered"
          description="The curriculum catalog is currently empty. Administrators can add subjects and topics."
          actionLabel={isAdmin ? 'Add First Subject' : undefined}
          onAction={isAdmin ? () => setDialogOpen(true) : undefined}
        />
      )}

      {!isLoading && !isError && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <Card key={sub.id} className="border-slate-200/90 hover:border-slate-300">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    {sub.code.slice(0, 3)}
                  </div>
                  <Badge variant="indigo" size="sm">
                    {sub.code}
                  </Badge>
                </div>
                <Badge variant="sky" size="sm">
                  Sem {sub.semester}
                </Badge>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <CardTitle className="text-base text-slate-900">{sub.name}</CardTitle>
                {sub.description && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {sub.description}
                  </p>
                )}

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Topics ({sub.topics.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {sub.topics.map((top) => (
                      <span
                        key={top}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200/60"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Admin Create Subject Modal */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Register New Subject Module"
        description="Add a curriculum discipline and list its associated topic areas."
      >
        <form onSubmit={handleCreateSubject} className="space-y-4 pt-2">
          <Input
            label="Subject Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Computer Networks"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Course Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., CS304"
              required
            />

            <Select
              label="Semester"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                value: s,
                label: `Semester ${s}`,
              }))}
            />
          </div>

          <Textarea
            label="Description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope of the subject module..."
          />

          <Input
            label="Topic Modules (comma-separated)"
            value={topicsString}
            onChange={(e) => setTopicsString(e.target.value)}
            placeholder="OSI Model, TCP/IP, Routing Protocols, DNS"
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createSubjectMutation.isPending}>
              Create Subject
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
