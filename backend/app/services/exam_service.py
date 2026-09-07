from sqlalchemy.orm import Session
from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamUpdate
from typing import Optional


def create_exam(db: Session, exam: ExamCreate, created_by: int) -> Exam:
    """Create a new exam record in the database."""
    db_exam = Exam(
        title=exam.title,
        description=exam.description,
        topic=exam.topic,
        total_marks=exam.total_marks,
        duration_minutes=exam.duration_minutes,
        negative_marks=exam.negative_marks,
        randomize_questions=exam.randomize_questions,
        created_by=created_by,
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam


def get_all_exams(db: Session, skip: int = 0, limit: int = 50, search: str = ""):
    """Fetch all active exams — supports pagination and search."""
    query = db.query(Exam).filter(Exam.is_active == True)
    if search:
        query = query.filter(Exam.title.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


def get_exam_by_id(db: Session, exam_id: int) -> Optional[Exam]:
    """Fetch a single exam by primary key."""
    return db.query(Exam).filter(Exam.id == exam_id).first()


def update_exam(db: Session, exam_id: int, updates: ExamUpdate) -> Optional[Exam]:
    """Partially update an exam (PATCH semantics)."""
    exam = get_exam_by_id(db, exam_id)
    if not exam:
        return None
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(exam, key, value)
    db.commit()
    db.refresh(exam)
    return exam


def delete_exam(db: Session, exam_id: int) -> bool:
    """Soft-delete an exam by deactivating it."""
    exam = get_exam_by_id(db, exam_id)
    if not exam:
        return False
    db.delete(exam)
    db.commit()
    return True