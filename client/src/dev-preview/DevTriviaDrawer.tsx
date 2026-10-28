import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchExternalTriviaQuestions } from './DevTriviaAdapter';
import type { Question } from '../types/question';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { getDifficultyColor } from '../lib/utils';

interface DevTriviaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevTriviaDrawer: React.FC<DevTriviaDrawerProps> = ({ isOpen, onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | boolean>>({});
  const [revealed, setRevealed] = useState(false);

  const loadTrivia = async () => {
    setLoading(true);
    setError(null);
    setRevealed(false);
    setSelectedAnswers({});
    try {
      const data = await fetchExternalTriviaQuestions(4);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Open Trivia data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative z-10 w-full max-w-2xl bg-slate-50 shadow-2xl flex flex-col h-full border-l border-slate-200">
        {/* Header */}
        <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Open Trivia Layout Inspector</h2>
              <p className="text-xs text-slate-500">
                Visual testing sandbox using real external trivia questions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Bar */}
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>External Data Sandbox:</strong> Questions are loaded from OpenTDB for UI layout validation only. Not connected to QBank DB.
          </span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {questions.length === 0 && !loading && !error && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Trivia Questions Loaded Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Fetch questions from the Open Trivia Database to visually test QBank question cards, option selectors, and difficulty badges.
              </p>
              <Button variant="primary" size="sm" onClick={loadTrivia} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Fetch Sample Trivia
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Fetching trivia from Open Trivia DB...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <p className="font-semibold mb-1">Failed to load external trivia:</p>
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadTrivia} className="mt-3">
                Try Again
              </Button>
            </div>
          )}

          {questions.map((q, idx) => {
            const diffColor = getDifficultyColor(q.difficulty);
            return (
              <Card key={q.id} className="overflow-hidden border-slate-200">
                <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                    <Badge variant="indigo">{q.subject}</Badge>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded border uppercase font-semibold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
                    >
                      {q.difficulty}
                    </span>
                    <Badge variant="slate">{q.type === 'mcq' ? 'MCQ' : 'True/False'}</Badge>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{q.marks} Mark</span>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-slate-900 leading-relaxed mb-4">{q.text}</p>

                  {/* Options */}
                  {q.type === 'mcq' && (
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isSelected = selectedAnswers[q.id] === opt;
                        const isCorrect = revealed && opt === q.correctAnswer;
                        const isWrong = revealed && isSelected && opt !== q.correctAnswer;

                        let style = 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700';
                        if (isSelected && !revealed) {
                          style = 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-semibold';
                        } else if (isCorrect) {
                          style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                        } else if (isWrong) {
                          style = 'border-rose-500 bg-rose-50 text-rose-900';
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              if (!revealed) {
                                setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt }));
                              }
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="grid grid-cols-2 gap-3">
                      {[true, false].map((val) => {
                        const isSelected = selectedAnswers[q.id] === val;
                        const isCorrect = revealed && val === q.correctAnswer;
                        const isWrong = revealed && isSelected && val !== q.correctAnswer;

                        let style = 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700';
                        if (isSelected && !revealed) {
                          style = 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-semibold';
                        } else if (isCorrect) {
                          style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                        } else if (isWrong) {
                          style = 'border-rose-500 bg-rose-50 text-rose-900';
                        }

                        return (
                          <button
                            key={String(val)}
                            type="button"
                            onClick={() => {
                              if (!revealed) {
                                setSelectedAnswers((prev) => ({ ...prev, [q.id]: val }));
                              }
                            }}
                            className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold text-center transition-colors ${style}`}
                          >
                            {val ? 'TRUE' : 'FALSE'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>

                {revealed && q.explanation && (
                  <CardFooter className="bg-slate-50 border-t border-slate-100 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900 mr-1.5">Note:</span> {q.explanation}
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer Actions */}
        {questions.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={loadTrivia} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Refresh Questions
            </Button>
            <Button
              variant={revealed ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setRevealed(!revealed)}
            >
              {revealed ? 'Hide Answers' : 'Reveal Answers & Check Layout'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
