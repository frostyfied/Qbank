import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { QuestionType, QuestionDifficulty, Question } from '../../types/question';
import type { Subject } from '../../types/subject';
import { useAuth } from '../auth/useAuth';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { LoadingState } from '../../components/feedback/LoadingState';
import { QuestionCard } from './QuestionCard';

interface FormProps {
  initialQuestion?: Question;
  isEditing: boolean;
  questionId?: string;
  subjects?: Subject[];
}

const QuestionFormInner: React.FC<FormProps> = ({
  initialQuestion,
  isEditing,
  questionId,
  subjects,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form Fields initialized directly from initialQuestion
  const [text, setText] = useState(initialQuestion?.text || '');
  const [type, setType] = useState<QuestionType>(initialQuestion?.type || 'mcq');
  const [subject, setSubject] = useState(initialQuestion?.subject || '');
  const [topic, setTopic] = useState(initialQuestion?.topic || '');
  const [semester, setSemester] = useState<number>(initialQuestion?.semester || 1);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(
    initialQuestion?.difficulty || 'medium'
  );
  const [marks, setMarks] = useState<number>(initialQuestion?.marks || 2);
  const [tags, setTags] = useState(
    initialQuestion?.tags ? initialQuestion.tags.join(', ') : ''
  );
  const [explanation, setExplanation] = useState(initialQuestion?.explanation || '');
  const [isPrivate, setIsPrivate] = useState(!!initialQuestion?.isPrivate);

  // Type-specific state
  const [options, setOptions] = useState<string[]>(
    initialQuestion?.type === 'mcq' && initialQuestion.options
      ? initialQuestion.options
      : ['', '', '', '']
  );
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);
  const [correctBool, setCorrectBool] = useState<boolean>(
    initialQuestion?.type === 'true_false' ? !!initialQuestion.correctAnswer : true
  );
  const [correctBlank, setCorrectBlank] = useState(
    initialQuestion?.type === 'fill_blank' ? String(initialQuestion.correctAnswer || '') : ''
  );
  const [programmingLang, setProgrammingLang] = useState(
    initialQuestion?.type === 'programming'
      ? initialQuestion.programmingLanguage || 'javascript'
      : 'javascript'
  );
  const [sampleCode, setSampleCode] = useState(
    initialQuestion?.type === 'programming' ? initialQuestion.sampleCode || '' : ''
  );

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!text.trim()) errs.text = 'Question statement is required.';
    if (!subject.trim()) errs.subject = 'Subject selection is required.';
    if (!topic.trim()) errs.topic = 'Topic name is required.';
    if (marks <= 0) errs.marks = 'Marks must be at least 1.';

    if (type === 'mcq') {
      const validOptions = options.filter((o) => o.trim() !== '');
      if (validOptions.length < 2) {
        errs.options = 'At least two non-empty options are required.';
      }
    }

    if (type === 'fill_blank' && !correctBlank.trim()) {
      errs.correctBlank = 'Correct blank answer is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: unknown) => {
      if (isEditing && questionId) {
        return apiClient.patch(API_ENDPOINTS.questions.update(questionId), payload);
      }
      return apiClient.post(API_ENDPOINTS.questions.create, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      navigate('/questions');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const isStudent = user?.role === 'student';
    const status = isStudent ? (isPrivate ? 'published' : 'pending') : 'published';

    const payload = {
      text,
      type,
      subject,
      topic,
      semester: Number(semester),
      difficulty,
      marks: Number(marks),
      tags: parsedTags,
      explanation,
      isPrivate: isStudent ? isPrivate : false,
      status,
      options: type === 'mcq' ? options : undefined,
      correctAnswer:
        type === 'mcq'
          ? options[correctOptionIdx]
          : type === 'true_false'
          ? correctBool
          : type === 'fill_blank'
          ? correctBlank
          : undefined,
      programmingLanguage: type === 'programming' ? programmingLang : undefined,
      sampleCode: type === 'programming' ? sampleCode : undefined,
    };

    saveMutation.mutate(payload);
  };

  const previewQuestion: Question = {
    id: 'preview-draft',
    text: text || 'Your question statement will appear here...',
    type,
    subject: subject || 'General Subject',
    topic: topic || 'Unspecified Topic',
    semester: Number(semester),
    difficulty,
    marks: Number(marks),
    tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    explanation,
    status: user?.role === 'student' ? 'pending' : 'published',
    createdAt: new Date().toISOString(),
    options: type === 'mcq' ? options : undefined,
    programmingLanguage: type === 'programming' ? programmingLang : undefined,
    sampleCode: type === 'programming' ? sampleCode : undefined,
  } as Question;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6"
    >
      {saveMutation.isError && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : 'Failed to submit question to the server.'}
          </span>
        </div>
      )}

      {/* Basic Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          error={errors.subject}
          placeholder="Select a subject..."
          options={[
            ...(subjects || []).map((s) => ({ value: s.name, label: s.name })),
            { value: 'Computer Science', label: 'Computer Science' },
            { value: 'Mathematics', label: 'Mathematics' },
            { value: 'Physics', label: 'Physics' },
            { value: 'Electrical Engineering', label: 'Electrical Engineering' },
          ]}
        />

        <Input
          label="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Graph Algorithms"
          error={errors.topic}
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

        <Select
          label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
          options={[
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' },
          ]}
        />

        <Select
          label="Question Type"
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          options={[
            { value: 'mcq', label: 'Multiple Choice (MCQ)' },
            { value: 'true_false', label: 'True / False' },
            { value: 'fill_blank', label: 'Fill in the Blank' },
            { value: 'short_answer', label: 'Short Answer' },
            { value: 'long_answer', label: 'Long Answer' },
            { value: 'programming', label: 'Programming' },
          ]}
        />

        <Input
          label="Marks"
          type="number"
          min={1}
          max={50}
          value={marks}
          onChange={(e) => setMarks(Number(e.target.value))}
          error={errors.marks}
        />
      </div>

      {/* Question Statement */}
      <Textarea
        label="Question Statement"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="State the problem clearly..."
        error={errors.text}
      />

      {/* Dynamic Type-Specific Fields */}
      {type === 'mcq' && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
            MCQ Options & Correct Answer
          </label>
          {errors.options && <p className="text-xs text-rose-600 font-medium">{errors.options}</p>}
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="radio"
                name="correctOption"
                checked={correctOptionIdx === i}
                onChange={() => setCorrectOptionIdx(i)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                title="Mark as correct option"
              />
              <Input
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
            </div>
          ))}
        </div>
      )}

      {type === 'true_false' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Correct Evaluation
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <input
                type="radio"
                checked={correctBool === true}
                onChange={() => setCorrectBool(true)}
                className="w-4 h-4 text-indigo-600"
              />
              TRUE
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <input
                type="radio"
                checked={correctBool === false}
                onChange={() => setCorrectBool(false)}
                className="w-4 h-4 text-indigo-600"
              />
              FALSE
            </label>
          </div>
        </div>
      )}

      {type === 'fill_blank' && (
        <Input
          label="Correct Answer for Blank"
          value={correctBlank}
          onChange={(e) => setCorrectBlank(e.target.value)}
          placeholder="e.g., polymorphism"
          error={errors.correctBlank}
        />
      )}

      {type === 'programming' && (
        <div className="space-y-3">
          <Select
            label="Programming Language"
            value={programmingLang}
            onChange={(e) => setProgrammingLang(e.target.value)}
            options={[
              { value: 'javascript', label: 'JavaScript' },
              { value: 'python', label: 'Python' },
              { value: 'java', label: 'Java' },
              { value: 'cpp', label: 'C++' },
              { value: 'c', label: 'C' },
            ]}
          />
          <Textarea
            label="Starter Code / Function Signature"
            rows={4}
            value={sampleCode}
            onChange={(e) => setSampleCode(e.target.value)}
            placeholder="def solution(nums):&#10;    # implement here"
          />
        </div>
      )}

      {/* Explanation & Tags */}
      <Textarea
        label="Explanation / Rubric Notes"
        rows={3}
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Detailed explanation displayed after quiz submission or to reviewing teachers..."
      />

      <Input
        label="Tags (comma-separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="algorithms, graphs, exam-2024"
      />

      {/* Student Private Question Option */}
      {user?.role === 'student' && (
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3">
          <input
            type="checkbox"
            id="privateCheck"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
          />
          <label htmlFor="privateCheck" className="text-xs text-slate-700">
            <strong className="block font-semibold text-slate-900">
              Keep as Private Practice Question
            </strong>
            If checked, this question will only appear in your personal practice sessions and will not be sent to teachers for review.
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreviewOpen(true)}
          leftIcon={<Eye className="w-4 h-4" />}
        >
          Preview Question Card
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={saveMutation.isPending}
          leftIcon={<Check className="w-4 h-4" />}
        >
          {isEditing ? 'Save Changes' : user?.role === 'student' ? 'Submit Question' : 'Publish Question'}
        </Button>
      </div>

      {/* Interactive Live Preview Modal */}
      <Dialog
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Live Question Card Preview"
        description="Inspect how this question appears inside the question bank"
      >
        <div className="py-2">
          <QuestionCard question={previewQuestion} showExplanation={!!explanation} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(false)}>
            Close Preview
          </Button>
        </div>
      </Dialog>
    </form>
  );
};

export const QuestionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<Subject[]>(API_ENDPOINTS.subjects.list),
  });

  // Fetch existing question if editing
  const { data: existingQuestion, isLoading } = useQuery<Question>({
    queryKey: ['question', id],
    queryFn: () => apiClient.get<Question>(API_ENDPOINTS.questions.detail(id!)),
    enabled: isEditing,
  });

  if (isEditing && isLoading) {
    return <LoadingState type="card" count={1} />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <h2 className="text-lg font-bold text-slate-900">
          {isEditing ? 'Edit Question' : user?.role === 'student' ? 'Submit Question for Review' : 'Author New Question'}
        </h2>
      </div>

      <QuestionFormInner
        key={existingQuestion?.id || 'new'}
        initialQuestion={existingQuestion}
        isEditing={isEditing}
        questionId={id}
        subjects={subjects}
      />
    </div>
  );
};
