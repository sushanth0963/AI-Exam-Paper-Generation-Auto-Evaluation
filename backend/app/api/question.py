from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionAdminResponse,
)
from app.services.question_service import (
    create_question,
    get_questions_by_exam,
    get_question_by_id,
    update_question,
    delete_question,
)
from app.services.exam_service import get_exam_by_id
from app.security import get_current_user, admin_required

router = APIRouter(prefix="/questions", tags=["Questions"])


# ── Create Question (Admin only) ────────────────────────────────────────────
@router.post("/create", response_model=QuestionAdminResponse, status_code=201)
def add_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin adds a question to an exam."""
    exam = get_exam_by_id(db, question.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return create_question(db, question)


# ── Get Questions by Exam (students get NO correct_answer) ──────────────────
@router.get("/exam/{exam_id}", response_model=List[QuestionResponse])
def get_exam_questions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns questions for an exam.
    Students do NOT receive correct_answer — that field is excluded from
    QuestionResponse intentionally.
    Questions are shuffled if the exam has randomize_questions=True.
    """
    exam = get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return get_questions_by_exam(db, exam_id, randomize=exam.randomize_questions)


# ── Get Questions with Answers (Admin only) ─────────────────────────────────
@router.get("/admin/exam/{exam_id}", response_model=List[QuestionAdminResponse])
def get_exam_questions_admin(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin fetches all questions with correct answers."""
    return get_questions_by_exam(db, exam_id)


# ── Update Question (Admin only) ────────────────────────────────────────────
@router.patch("/{question_id}", response_model=QuestionAdminResponse)
def update_question_route(
    question_id: int,
    updates: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin partially updates a question."""
    question = update_question(db, question_id, updates)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


# ── Delete Question (Admin only) ────────────────────────────────────────────
@router.delete("/{question_id}", status_code=204)
def delete_question_route(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin deletes a question."""
    success = delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")