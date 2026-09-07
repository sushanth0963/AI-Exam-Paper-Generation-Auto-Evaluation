// Shared TypeScript types for the AI Exam Platform

export interface User {
  id: number;
  username: string;
  email: string;
  role: "student" | "admin";
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  topic: string;
  total_marks: number;
  duration_minutes: number;
  negative_marks: number;
  is_active: boolean;
  randomize_questions: boolean;
  created_by: number;
  created_at: string;
}

export interface Question {
  id: number;
  exam_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  correct_answer?: string; // Only present for admin responses
}

export interface AnswerSubmission {
  question_id: number;
  selected_answer: string;
}

export interface Result {
  id: number;
  user_id: number;
  exam_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  skipped: number;
  percentage: number;
  started_at: string;
  submitted_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  score: number;
  percentage: number;
  submitted_at: string;
}

export interface SubmitResult {
  message: string;
  result_id: number;
  score: number;
  total_marks: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  skipped: number;
  percentage: number;
  time_taken_minutes: number;
}
