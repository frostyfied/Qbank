export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  description?: string;
  topics: string[];
  questionCount?: number;
}
