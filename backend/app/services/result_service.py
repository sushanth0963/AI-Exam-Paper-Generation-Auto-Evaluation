import json
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.models.question import Question
from app.models.result import Result
from app.models.user import User
from app.models.exam import Exam
from app.schemas.result import ExamSubmission


def submit_exam(db: Session, submission: ExamSubmission, user_id: int) -> dict:
    """
    Score an exam submission:
    - Correct answer   → +question.marks
    - Wrong answer     → -exam.negative_marks
    - No answer        → 0 (skipped)
    Prevents duplicate submissions.
    """
    # --- Duplicate-attempt guard ---
    existing = (
        db.query(Result)
        .filter(Result.user_id == user_id, Result.exam_id == submission.exam_id)
        .first()
    )
    if existing:
        return {"error": "You have already attempted this exam."}

    # --- Fetch exam ---
    exam = db.query(Exam).filter(Exam.id == submission.exam_id).first()
    if not exam:
        return {"error": "Exam not found."}

    now = datetime.utcnow()
    started_at = submission.started_at
    if started_at.tzinfo is not None:
        started_at = started_at.astimezone(timezone.utc).replace(tzinfo=None)
    time_taken = (now - started_at).total_seconds() / 60


    # --- Fetch all questions for this exam ---
    all_questions = (
        db.query(Question)
        .filter(Question.exam_id == submission.exam_id)
        .all()
    )
    question_map = {q.id: q for q in all_questions}
    total_questions = len(all_questions)

    answered_ids = {ans.question_id for ans in submission.answers}
    skipped = total_questions - len(answered_ids)

    score = 0.0
    correct = 0
    wrong = 0

    for ans in submission.answers:
        question = question_map.get(ans.question_id)
        if not question:
            continue
        if ans.selected_answer.upper() == question.correct_answer.upper():
            score += question.marks
            correct += 1
        else:
            score -= exam.negative_marks
            wrong += 1

    score = max(score, 0.0)  # floor at 0
    percentage = round((score / exam.total_marks) * 100, 2) if exam.total_marks > 0 else 0.0

    # --- Persist result ---
    result = Result(
        user_id=user_id,
        exam_id=submission.exam_id,
        score=score,
        total_questions=total_questions,
        correct_answers=correct,
        wrong_answers=wrong,
        skipped=skipped,
        percentage=percentage,
        started_at=submission.started_at,
        submitted_at=now,
        answers_json=json.dumps([
            {"question_id": a.question_id, "selected": a.selected_answer}
            for a in submission.answers
        ]),
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return {
        "id": result.id,
        "message": "Exam submitted successfully.",
        "result_id": result.id,
        "score": score,
        "total_marks": exam.total_marks,
        "total_questions": total_questions,
        "correct_answers": correct,
        "wrong_answers": wrong,
        "skipped": skipped,
        "percentage": percentage,
        "time_taken_minutes": round(time_taken, 2),
    }


def get_user_results(db: Session, user_id: int) -> List[Result]:
    """Fetch all past results for a given student."""
    return (
        db.query(Result)
        .filter(Result.user_id == user_id)
        .order_by(Result.submitted_at.desc())
        .all()
    )


def get_result_by_id(db: Session, result_id: int):
    """Fetch a single result record."""
    return db.query(Result).filter(Result.id == result_id).first()


def get_exam_results(db: Session, exam_id: int) -> List[Result]:
    """Fetch all results for an exam (admin analytics)."""
    return (
        db.query(Result)
        .filter(Result.exam_id == exam_id)
        .order_by(Result.score.desc())
        .all()
    )


def get_exam_leaderboard(db: Session, exam_id: int) -> List[dict]:
    """Return ranked leaderboard for an exam."""
    results = (
        db.query(Result, User)
        .join(User, Result.user_id == User.id)
        .filter(Result.exam_id == exam_id)
        .order_by(Result.score.desc())
        .all()
    )

    leaderboard = []
    for rank, (result, user) in enumerate(results, start=1):
        leaderboard.append({
            "rank": rank,
            "user_id": user.id,
            "username": user.username,
            "score": result.score,
            "percentage": result.percentage,
            "submitted_at": result.submitted_at.isoformat(),
        })
    return leaderboard


def check_already_attempted(db: Session, user_id: int, exam_id: int) -> bool:
    """Returns True if the user has already submitted this exam."""
    return (
        db.query(Result)
        .filter(Result.user_id == user_id, Result.exam_id == exam_id)
        .first()
    ) is not None