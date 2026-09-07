from pydantic import BaseModel
from typing import Optional


class QuestionCreate(BaseModel):
    exam_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str   # "A" | "B" | "C" | "D"
    marks: Optional[float] = 1.0


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    marks: Optional[float] = None


class QuestionResponse(BaseModel):
    id: int
    exam_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    marks: float
    # NOTE: correct_answer is intentionally excluded from student-facing responses

    class Config:
        from_attributes = True


class QuestionAdminResponse(QuestionResponse):
    """Full response including correct answer — admin only."""
    correct_answer: str