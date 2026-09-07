from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Exam(Base):
    """Exam model — holds exam metadata created by admins."""
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)          # human-readable description
    topic = Column(String, nullable=True)
    total_marks = Column(Integer, nullable=False, default=0)
    duration_minutes = Column(Integer, nullable=False, default=30)
    negative_marks = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    randomize_questions = Column(Boolean, default=False)  # shuffle question order
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # One-to-many: exam → questions
    questions = relationship(
        "Question",
        back_populates="exam",
        cascade="all, delete"
    )

    # One-to-many: exam → results
    results = relationship(
        "Result",
        back_populates="exam",
        cascade="all, delete"
    )