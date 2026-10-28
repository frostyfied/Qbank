import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Check, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
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
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { QuestionCard } from './QuestionCard';

interface FormProps {
  initialQuestion?: Question;
  isEditing: boolean;
  questionId?: string;
  subjects?: Subject[];
  defaultSubject?: string;
  defaultSemester?: number;
}

const QuestionFormInner: React.FC<FormProps> = ({
  initialQuestion, isEditing, questionId, subjects, defaultSubject, defaultSemester,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [text, setText] = useState(initialQuestion?.text || '');
  const [type, setType] = useState<QuestionType>(initialQuestion?.type || 'mcq');
  const [subject, setSubject] = useState(initialQuestion?.subjectName || (initialQuestion as any)?.subject || defaultSubject || '');
  const [topic, setTopic] = useState(initialQuestion?.topic || '');
  const [semester, setSemester] = useState<number>(initialQuestion?.semester || defaultSemester || 1);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(initialQuestion?.difficulty || 'medium');
  const [marks, setMarks] = useState<number>(initialQuestion?.marks || 2);
  const [tags, setTags] = useState(initialQuestion?.tags ? initialQuestion.tags.join(', ') : '');
  const [explanation, setExplanation] = useState(initialQuestion?.explanation || '');
  const [isPrivate, setIsPrivate] = useState(!!initialQuestion?.isPrivate);

  const [options, setOptions] = useState<string[]>(
    initialQuestion?.type === 'mcq' && initialQuestion.options ? initialQuestion.options : ['', '', '', '']
  );
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);
  const [correctBool, setCorrectBool] = useState<boolean>(initialQuestion?.type === 'true_false' ? !!initialQuestion.correctAnswer : true);
  const [correctBlank, setCorrectBlank] = useState(initialQuestion?.type === 'fill_blank' ? String(initialQuestion.correctAnswer || '') : '');
  const [programmingLang, setProgrammingLang] = useState(initialQuestion?.type === 'programming' ? initialQuestion.programmingLanguage || 'javascript' : 'javascript');
  const [sampleCode, setSampleCode] = useState(initialQuestion?.type === 'programming' ? initialQuestion.sampleCode || '' : '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!text.trim()) errs.text = 'Question statement is required.';
    if (!subject.trim()) errs.subject = 'Subject selection is required.';
    if (!topic.trim()) errs.topic = 'Topic name is required.';
    if (marks <= 0) errs.marks = 'Marks must be at least 1.';
    if (type === 'mcq' && options.filter((o) => o.trim() !== '').length < 2) errs.options = 'At least two options required.';
    if (type === 'fill_blank' && !correctBlank.trim()) errs.correctBlank = 'Correct answer required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: unknown) => {
      if (isEditing && questionId) return apiClient.patch(API_ENDPOINTS.questions.update(questionId), payload);
      return apiClient.post(API_ENDPOINTS.questions.create, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      navigate(user?.role === 'student' ? '/questions' : '/subjects'); 
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // CRITICAL FIX: Find the actual subject ObjectId to satisfy the backend schema
    const selectedSubjObj = subjects?.find((s) => s.name === subject);
    if (!selectedSubjObj) {
      setErrors((prev) => ({ ...prev, subject: 'Invalid subject selected.' }));
      return;
    }

    const parsedTags = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const isStudent = user?.role === 'student';
    const status = isStudent ? (isPrivate ? 'published' : 'pending') : 'published';

    const payload = {
      text,
      type,
      subjectId: selectedSubjObj._id, // SENDING THE ID!
      topic,
      semester: Number(semester),
      difficulty,
      marks: Number(marks),
      tags: parsedTags,
      explanation,
      isPrivate: isStudent ? isPrivate : false,
      status,
      options: type === 'mcq' ? options : undefined,
      correctAnswer: type === 'mcq' ? options[correctOptionIdx] : type === 'true_false' ? correctBool : type === 'fill_blank' ? correctBlank : undefined,
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
    status: isPrivate ? 'published' : 'pending',
    createdAt: new Date().toISOString(),
    options: type === 'mcq' ? options : undefined,
  } as Question;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
      {saveMutation.isError && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{saveMutation.error instanceof Error ? saveMutation.error.message : 'Failed to submit.'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          error={errors.subject}
          placeholder="Select a subject..."
          options={(subjects || []).map((s) => ({ value: s.name, label: s.name }))}
        />
        <Input label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Graph Algorithms" error={errors.topic} />
        <Select label="Semester" value={semester} onChange={(e) => setSemester(Number(e.target.value))} options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Semester ${s}` }))} />
        <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
        <Select label="Question Type" value={type} onChange={(e) => setType(e.target.value as QuestionType)} options={[{ value: 'mcq', label: 'Multiple Choice (MCQ)' }, { value: 'true_false', label: 'True / False' }, { value: 'fill_blank', label: 'Fill in the Blank' }, { value: 'short_answer', label: 'Short Answer' }, { value: 'long_answer', label: 'Long Answer' }, { value: 'programming', label: 'Programming' }]} />
        <Input label="Marks" type="number" min={1} max={50} value={marks} onChange={(e) => setMarks(Number(e.target.value))} error={errors.marks} />
      </div>

      <Textarea label="Question Statement" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="State the problem clearly..." error={errors.text} />

      {type === 'mcq' && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">MCQ Options</label>
          {errors.options && <p className="text-xs text-rose-600">{errors.options}</p>}
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="radio" checked={correctOptionIdx === i} onChange={() => setCorrectOptionIdx(i)} className="w-4 h-4 text-indigo-600" />
              <Input value={opt} onChange={(e) => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
            </div>
          ))}
        </div>
      )}

      {type === 'true_false' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Correct Evaluation</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="radio" checked={correctBool === true} onChange={() => setCorrectBool(true)} /> TRUE</label>
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="radio" checked={correctBool === false} onChange={() => setCorrectBool(false)} /> FALSE</label>
          </div>
        </div>
      )}

      {type === 'fill_blank' && <Input label="Correct Answer for Blank" value={correctBlank} onChange={(e) => setCorrectBlank(e.target.value)} error={errors.correctBlank} />}

      <Textarea label="Explanation / Rubric Notes (Optional)" rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      <Input label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="algorithms, graphs" />

      {user?.role === 'student' && (
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3">
          <input type="checkbox" id="privateCheck" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-0.5 w-4 h-4 text-indigo-600 rounded" />
          <label htmlFor="privateCheck" className="text-xs text-slate-700">
            <strong className="block font-semibold text-slate-900">Keep as Private Practice Question</strong>
            If checked, this question will only appear in your personal practice sessions.
          </label>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)} leftIcon={<Eye className="w-4 h-4" />}>Preview</Button>
        <Button type="submit" variant="primary" size="md" isLoading={saveMutation.isPending} leftIcon={<Check className="w-4 h-4" />}>
          {isEditing ? 'Save Changes' : isPrivate ? 'Save Private Question' : 'Publish Question'}
        </Button>
      </div>

      <Dialog isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Live Preview" description="How this appears">
        <div className="py-2"><QuestionCard question={previewQuestion} showExplanation={!!explanation} /></div>
      </Dialog>
    </form>
  );
};

export const QuestionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { data: subjectsData, isLoading } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => apiClient.get<Subject[]>(API_ENDPOINTS.subjects.list),
  });
  
  const safeSubjects = Array.isArray(subjectsData) ? subjectsData : [];

  const { data: existingQuestion, isLoading: isLoadingQuestion } = useQuery<Question>({
    queryKey: ['question', id],
    queryFn: () => apiClient.get<Question>(API_ENDPOINTS.questions.detail(id!)),
    enabled: isEditing,
  });

  if (isEditing && isLoadingQuestion) return <LoadingState type="card" count={1} />;

  // If teacher is creating a new question and hasn't selected a subject yet, show the subject grid
  if (user?.role === 'teacher' && !isEditing && !selectedSubject) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Select Subject for New Question</h2>
          <p className="text-xs text-slate-500">Choose which course this question belongs to.</p>
        </div>
        {isLoading ? <LoadingState type="card" count={3} /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeSubjects.map((s) => (
              <button key={s._id} onClick={() => setSelectedSubject(s)} className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between group">
                <div>
                  <Badge variant="indigo" className="mb-2 font-mono">{s.code}</Badge>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 mb-1">{s.name}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end text-xs font-bold text-indigo-600">
                  Select <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => { if (user?.role === 'teacher' && !isEditing) setSelectedSubject(null); else navigate(-1); }} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <h2 className="text-lg font-bold text-slate-900">
          {isEditing ? 'Edit Question' : `Author: ${selectedSubject?.name}`}
        </h2>
      </div>
      <QuestionFormInner
        key={existingQuestion?._id || selectedSubject?._id || 'new'}
        initialQuestion={existingQuestion}
        isEditing={isEditing}
        questionId={id}
        subjects={safeSubjects}
        defaultSubject={selectedSubject?.name}
        defaultSemester={selectedSubject?.semester}
      />
    </div>
  );
};