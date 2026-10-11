import type { Question } from '../types/question';

interface OpenTDBResponse {
  response_code: number;
  results: Array<{
    type: 'multiple' | 'boolean';
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }>;
}

function decodeHtml(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

export async function fetchExternalTriviaQuestions(amount = 5): Promise<Question[]> {
  try {
    const res = await fetch(`https://opentdb.com/api.php?amount=${amount}`);
    if (!res.ok) {
      throw new Error(`OpenTDB error: ${res.status}`);
    }
    const data: OpenTDBResponse = await res.json();
    if (data.response_code !== 0 || !data.results) {
      throw new Error('Unable to retrieve trivia questions from OpenTDB API');
    }

    return data.results.map((item, idx) => {
      const decodedQuestion = decodeHtml(item.question);
      const isBoolean = item.type === 'boolean';

      if (isBoolean) {
        return {
          id: `trivia-tf-${idx}`,
          text: decodedQuestion,
          type: 'true_false' as const,
          subject: `External: ${decodeHtml(item.category)}`,
          topic: 'Trivia Showcase',
          semester: 1,
          difficulty: item.difficulty,
          marks: 1,
          tags: ['external-trivia', 'dev-preview'],
          explanation: `Correct Answer: ${decodeHtml(item.correct_answer)}`,
          correctAnswer: item.correct_answer.toLowerCase() === 'true',
          status: 'published' as const,
          createdAt: new Date().toISOString(),
        };
      }

      const allOptions = [...item.incorrect_answers.map(decodeHtml), decodeHtml(item.correct_answer)];
      // Simple shuffle
      allOptions.sort(() => Math.random() - 0.5);

      return {
        id: `trivia-mcq-${idx}`,
        text: decodedQuestion,
        type: 'mcq' as const,
        subject: `External: ${decodeHtml(item.category)}`,
        topic: 'Trivia Showcase',
        semester: 1,
        difficulty: item.difficulty,
        marks: 2,
        tags: ['external-trivia', 'dev-preview'],
        explanation: `Correct Answer: ${decodeHtml(item.correct_answer)}`,
        options: allOptions,
        correctAnswer: decodeHtml(item.correct_answer),
        status: 'published' as const,
        createdAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('Dev Preview Trivia Fetch error:', err);
    throw err;
  }
}
