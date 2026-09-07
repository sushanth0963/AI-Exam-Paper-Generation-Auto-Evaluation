import random
from sqlalchemy.orm import Session
from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionUpdate
from typing import List, Optional


def create_question(db: Session, question: QuestionCreate) -> Question:
    """Create a new MCQ question for an exam."""
    db_question = Question(
        exam_id=question.exam_id,
        question_text=question.question_text,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_answer=question.correct_answer.upper(),
        marks=question.marks,
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


def get_questions_by_exam(
    db: Session,
    exam_id: int,
    randomize: bool = False
) -> List[Question]:
    """Fetch all questions for an exam, optionally shuffled."""
    questions = (
        db.query(Question)
        .filter(Question.exam_id == exam_id)
        .all()
    )
    if randomize:
        random.shuffle(questions)
    return questions


def get_question_by_id(db: Session, question_id: int) -> Optional[Question]:
    """Fetch a single question by ID."""
    return db.query(Question).filter(Question.id == question_id).first()


def update_question(
    db: Session,
    question_id: int,
    updates: QuestionUpdate
) -> Optional[Question]:
    """Partially update a question."""
    question = get_question_by_id(db, question_id)
    if not question:
        return None
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(question, key, value)
    db.commit()
    db.refresh(question)
    return question


def delete_question(db: Session, question_id: int) -> bool:
    """Delete a question by ID."""
    question = get_question_by_id(db, question_id)
    if not question:
        return False
    db.delete(question)
    db.commit()
    return True