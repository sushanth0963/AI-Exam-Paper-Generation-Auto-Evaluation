from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse
from app.services.exam_service import (
    create_exam,
    get_all_exams,
    get_exam_by_id,
    update_exam,
    delete_exam,
)
from app.security import get_current_user, admin_required

router = APIRouter(prefix="/exam", tags=["Exam"])


# ── Create Exam (Admin only) ────────────────────────────────────────────────
@router.post("/create", response_model=ExamResponse, status_code=201)
def create_new_exam(
    exam: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin creates a new exam."""
    return create_exam(db, exam, current_user.id)


# ── Get All Exams (paginated + search) ─────────────────────────────────────
@router.get("/all", response_model=List[ExamResponse])
def fetch_all_exams(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Any authenticated user can list exams."""
    return get_all_exams(db, skip=skip, limit=limit, search=search)


# ── Get Single Exam ─────────────────────────────────────────────────────────
@router.get("/{exam_id}", response_model=ExamResponse)
def fetch_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single exam by ID."""
    exam = get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


# ── Update Exam (Admin only) ────────────────────────────────────────────────
@router.patch("/{exam_id}", response_model=ExamResponse)
def update_exam_route(
    exam_id: int,
    updates: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin partially updates an exam."""
    exam = update_exam(db, exam_id, updates)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


# ── Delete Exam (Admin only) ────────────────────────────────────────────────
@router.delete("/{exam_id}", status_code=204)
def delete_exam_route(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin deletes an exam and all its questions/results."""
    success = delete_exam(db, exam_id)
    if not success:
        raise HTTPException(status_code=404, detail="Exam not found")