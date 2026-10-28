import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, Edit3, Trash2, Layers, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Subject } from '../../types/subject';
import type { Question } from '../../types/question';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';

export const SubjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Fetch Subjects
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<Subject[]>(API_ENDPOINTS.subjects.list),
  });

  // Fetch Questions (Only when a subject is clicked)
  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery<{ questions: Question[] }>({
    queryKey: ['questions', selectedSubject?.name],
    queryFn: () => apiClient.get<{ questions: Question[] }>(API_ENDPOINTS.questions.list, { subject: selectedSubject?.name, limit: 100 }),
    enabled: !!selectedSubject,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(API_ENDPOINTS.questions.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  const safeSubjects = Array.isArray(subjectsData) ? subjectsData : [];
  const questions = questionsData?.questions || [];

  if (isLoadingSubjects) return <LoadingState type="card" count={4} />;

  // VIEW 1: The Grid
  if (!selectedSubject) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Academic Curriculum & Subjects</h2>
          <p className="text-xs text-slate-500 mt-0.5">Browse subjects, course modules, and syllabus topics mapped to the question bank.</p>
        </div>
        
        {safeSubjects.length === 0 ? (
          <EmptyState title="No Subjects Found" description="There are no subjects available yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeSubjects.map((s) => (
              <div 
                key={s._id} 
                onClick={() => setSelectedSubject(s)}
                className="text-left bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo">{s.code.slice(0, 2)}</Badge>
                    <Badge variant="slate" className="font-mono text-[10px]">{s.code}</Badge>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">SEM {s.semester}</span>
                </div>
                <div className="p-5 flex-1">
                  <h3 className="text-base font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    <Layers className="w-3.5 h-3.5" /> Topics ({s.topics?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.topics?.slice(0, 3).map((t: string) => (
                      <span key={t} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                   <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Questions <ArrowRight className="w-3.5 h-3.5" />
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Questions inside the clicked subject
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedSubject(null)} leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{selectedSubject.name}</h2>
            <p className="text-xs text-slate-500">Managing {questions.length} questions</p>
          </div>
        </div>
        <Link to="/questions/create">
          <Button variant="primary" size="sm">Create New Question Here</Button>
        </Link>
      </div>

      {isLoadingQuestions ? (
        <LoadingState type="card" count={3} />
      ) : questions.length === 0 ? (
        <EmptyState title="No Questions Yet" description="You haven't created any questions for this subject." />
      ) : (
        <div className="space-y-3">
          {questions.map((q: any) => (
            <Card key={q._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="slate">{q.type.toUpperCase()}</Badge>
                  <Badge variant={q.difficulty === 'easy' ? 'emerald' : q.difficulty === 'medium' ? 'amber' : 'rose'}>{q.difficulty}</Badge>
                  <span className="text-xs text-slate-400 font-medium">Topic: {q.topic}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{q.text}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/questions/${q._id}/edit`}>
                  <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>Edit</Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => { if(window.confirm('Delete this question permanently?')) deleteMutation.mutate(q._id); }}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};