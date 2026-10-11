export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'fill_blank'
  | 'short_answer'
  | 'long_answer'
  | 'programming';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionStatus = 'pending' | 'approved' | 'rejected' | 'published';

export interface BaseQuestion {
  id: string;
  text: string;
  type: QuestionType;
  subject: string;
  topic: string;
  semester: number;
  difficulty: QuestionDifficulty;
  marks: number;
  tags: string[];
  explanation?: string;
  authorId?: string;
  authorName?: string;
  isPrivate?: boolean;
  status: QuestionStatus;
  reviewFeedback?: string;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  correctAnswer?: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correctAnswer?: boolean;
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank';
  correctAnswer?: string;
  acceptedAnswers?: string[];
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  sampleAnswer?: string;
}

export interface LongAnswerQuestion extends BaseQuestion {
  type: 'long_answer';
  rubricNotes?: string;
}

export interface ProgrammingQuestion extends BaseQuestion {
  type: 'programming';
  programmingLanguage?: string;
  sampleCode?: string;
  testCasesHint?: string;
}

export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion
  | ProgrammingQuestion;

export interface QuestionFilters {
  search?: string;
  subject?: string;
  topic?: string;
  semester?: number | string;
  difficulty?: QuestionDifficulty | 'all';
  type?: QuestionType | 'all';
  page?: number;
  limit?: number;
}
