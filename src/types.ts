export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type QuestionType = 'mcq' | 'subjective' | 'both';

export interface Question {
  id: string;
  type: 'mcq' | 'subjective';
  question: string;
  options?: string[]; // Only for MCQ
  correctAnswer: string;
  explanation: string;
  weightage: number; // New: weightage for marking scheme
}

export interface Quiz {
  id: string;
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType; // New: selected question type
  questions: Question[];
  createdAt: number;
  isFocusMode?: boolean; // New: focus mode toggle
  generateFlashcards?: boolean; // New: flashcard toggle
}

export interface Answer {
  questionId: string;
  userAnswer: string;
  score?: number; // 0 or 1 for MCQ, 0-10 for subjective
  feedback?: string; // Only for subjective
  marksObtained?: number; // New: actual marks based on weightage
}

export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  topic: string;
  answers: Answer[];
  totalScore: number; // This will be the sum of marksObtained
  correctCount: number; // New: count of correct answers (increment total marks +1)
  maxScore: number;
  attemptedCount: number;
  unattemptedCount: number;
  markedForLaterCount: number;
  strengths: string[];
  weaknesses: string[];
  aiFeedback: string;
  suggestions: string[];
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  streak?: number; // New: study streak
  lastStudyDate?: number; // New: to track streak
  badges?: string[]; // New: earned badges
}
