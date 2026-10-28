import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { Subject } from '../../types/subject';
import type { QuestionDifficulty, QuestionType } from '../../types/question';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const QuizSetupPage: React.FC = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | 'all'>('all');
  const [questionType, setQuestionType] = useState<QuestionType | 'all'>('all');
  const [count, setCount] = useState<number>(5);

  const { data: subjectsData } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<Subject[]>(API_ENDPOINTS.subjects.list),
  });

  const safeSubjects = Array.isArray(subjectsData) ? subjectsData : [];

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<{ quizId: string }>(API_ENDPOINTS.quizzes.generate, {
        subject: subject || undefined,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
        type: questionType !== 'all' ? questionType : undefined,
        count: Number(count),
      });
    },
    onSuccess: (data) => {
      navigate(`/quizzes/${data.quizId}`);
    },
  });

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    generateQuizMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Configure Practice Assessment</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Customise your self-paced revision quiz according to subject, difficulty, and format
        </p>
      </div>

      <form onSubmit={handleStartQuiz}>
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100">
            <CardTitle className="text-sm">Assessment Parameters</CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {generateQuizMutation.isError && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  {generateQuizMutation.error instanceof Error
                    ? generateQuizMutation.error.message
                    : 'Failed to generate quiz.'}
                </span>
              </div>
            )}

            <Select
              label="Subject Focus"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Any Subject (Broad Revision)"
              options={[
                { value: '', label: 'All Subjects (Comprehensive)' },
                ...safeSubjects.map((s) => ({ value: s.name, label: s.name })),
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Difficulty Target"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty | 'all')}
                options={[
                  { value: 'all', label: 'Mixed Difficulty' },
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
              />

              <Select
                label="Question Format"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType | 'all')}
                options={[
                  { value: 'all', label: 'All Formats' },
                  { value: 'mcq', label: 'Multiple Choice Only' },
                  { value: 'true_false', label: 'True / False Only' },
                  { value: 'fill_blank', label: 'Fill in the Blank' },
                  { value: 'short_answer', label: 'Short Answer' },
                  { value: 'long_answer', label: 'Long Answer' },
                  { value: 'programming', label: 'Programming' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Question Count"
                type="number"
                min={3}
                max={30}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                helperText="Select between 3 and 30 questions"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={generateQuizMutation.isPending}
                leftIcon={<Play className="w-4 h-4 fill-current" />}
              >
                Generate & Start Practice Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};