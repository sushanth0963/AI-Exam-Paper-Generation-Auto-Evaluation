from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    topic: Optional[str] = ""
    total_marks: int
    duration_minutes: int
    negative_marks: Optional[float] = 0.0
    randomize_questions: Optional[bool] = False


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    topic: Optional[str] = None
    total_marks: Optional[int] = None
    duration_minutes: Optional[int] = None
    negative_marks: Optional[float] = None
    is_active: Optional[bool] = None
    randomize_questions: Optional[bool] = None


class ExamResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    topic: Optional[str]
    total_marks: int
    duration_minutes: int
    negative_marks: float
    is_active: bool
    randomize_questions: bool
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True