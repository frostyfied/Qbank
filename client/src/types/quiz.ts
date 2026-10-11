import type { QuestionDifficulty, QuestionType, Question } from './question';

export interface QuizConfig {
  subjectId?: string;
  topic?: string;
  semester?: number;
  difficulty?: QuestionDifficulty | 'all';
  type?: QuestionType | 'all';
  count: number;
  timed: boolean;
  timeLimitMinutes?: number;
}

export interface QuizQuestionAnswer {
  questionId: string;
  userAnswer?: string | boolean;
}

export interface QuizAttemptQuestionItem {
  question: Question;
  userAnswer?: string | boolean;
  correctAnswer?: string | boolean;
  isCorrect?: boolean;
  awardedMarks?: number;
  gradingStatus: 'auto_graded' | 'pending_review' | 'manual_graded';
  teacherFeedback?: string;
}

export interface QuizAttempt {
  id: string;
  subjectName?: string;
  difficulty?: string;
  totalQuestions: number;
  score: number;
  maxScore: number;
  percentage: number;
  durationSecondsTaken: number;
  timeLimitMinutes?: number;
  overallGradingStatus: 'completed' | 'pending_manual_grading';
  submittedAt: string;
  questions?: QuizAttemptQuestionItem[];
}
