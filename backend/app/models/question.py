from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.database import Base


class Question(Base):
    """MCQ Question model linked to an Exam."""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    question_text = Column(String, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False)   # "A" | "B" | "C" | "D"
    marks = Column(Float, default=1.0)                 # marks awarded for correct answer

    # Many-to-one: question → exam
    exam = relationship("Exam", back_populates="questions")