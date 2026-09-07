from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.schemas.result import ExamSubmission, ResultResponse
from app.services.result_service import (
    submit_exam,
    get_user_results,
    get_result_by_id,
    get_exam_results,
    get_exam_leaderboard,
    check_already_attempted,
)
from app.security import get_current_user, admin_required

router = APIRouter(prefix="/results", tags=["Results"])


# ── Submit Exam ─────────────────────────────────────────────────────────────
@router.post("/submit")
def submit_exam_api(
    submission: ExamSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student submits exam answers. Auto-scores and stores result."""
    result = submit_exam(db, submission, user_id=current_user.id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ── Check if Already Attempted ──────────────────────────────────────────────
@router.get("/check/{exam_id}")
def check_attempt(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns whether the current user has already attempted this exam."""
    attempted = check_already_attempted(db, current_user.id, exam_id)
    return {"attempted": attempted}


# ── Get My Results ──────────────────────────────────────────────────────────
@router.get("/my", response_model=List[ResultResponse])
def get_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student fetches their own result history."""
    return get_user_results(db, current_user.id)


# ── Get Result by ID ────────────────────────────────────────────────────────
@router.get("/detail/{result_id}", response_model=ResultResponse)
def get_result_detail(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a specific result by its ID."""
    result = get_result_by_id(db, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    # Students can only view their own results
    if current_user.role != "admin" and result.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return result


# ── Get All Results for an Exam (Admin analytics) ───────────────────────────
@router.get("/exam/{exam_id}")
def get_results_by_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin fetches analytics for an exam."""
    results = get_exam_results(db, exam_id)
    total_students = len(results)
    average_score = (
        round(sum(r.score for r in results) / total_students, 2)
        if total_students > 0
        else 0
    )
    average_pct = (
        round(sum(r.percentage for r in results) / total_students, 2)
        if total_students > 0
        else 0
    )
    return {
        "exam_id": exam_id,
        "total_students": total_students,
        "average_score": average_score,
        "average_percentage": average_pct,
        "results": results,
    }


# ── Leaderboard for an Exam ─────────────────────────────────────────────────
@router.get("/leaderboard/{exam_id}")
def exam_leaderboard(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Public leaderboard for an exam (authenticated users)."""
    leaderboard = get_exam_leaderboard(db, exam_id)
    return {"exam_id": exam_id, "leaderboard": leaderboard}