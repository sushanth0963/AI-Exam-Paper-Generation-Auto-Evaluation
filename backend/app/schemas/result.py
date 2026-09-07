from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class AnswerSubmission(BaseModel):
    question_id: int
    selected_answer: str   # "A" | "B" | "C" | "D"


class ExamSubmission(BaseModel):
    exam_id: int
    started_at: datetime
    answers: List[AnswerSubmission]


class ResultResponse(BaseModel):
    id: int
    user_id: int
    exam_id: int
    score: float
    total_questions: int
    correct_answers: int
    wrong_answers: int
    skipped: int
    percentage: float
    started_at: datetime
    submitted_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    score: float
    percentage: float
    submitted_at: datetime