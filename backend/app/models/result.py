from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Result(Base):
    """Stores a student's exam attempt result."""
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    skipped = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    answers_json = Column(String, nullable=True)  # JSON string of submitted answers

    # Relationships
    user = relationship("User", back_populates="results")
    exam = relationship("Exam", back_populates="results")