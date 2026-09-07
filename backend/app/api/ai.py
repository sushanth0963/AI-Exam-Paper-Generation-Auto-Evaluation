from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.services.ai_service import generate_questions
from app.services.question_service import create_question
from app.schemas.question import QuestionCreate
from app.security import admin_required

from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/predict")
async def predict():
    return {"message": "Prediction successful"}



@router.post("/generate")
def ai_generate_questions(
    topic: str = Query(..., description="Topic to generate questions about"),
    exam_id: int = Query(..., description="Exam ID to attach questions to"),
    count: int = Query(5, ge=1, le=20, description="Number of questions to generate"),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """
    Admin: Auto-generate MCQ questions using OpenAI GPT.
    Falls back to sample questions if API key is not configured.
    """
    questions = generate_questions(topic, count)

    if isinstance(questions, dict) and "error" in questions:
        return {"error": questions["error"], "questions_saved": 0}

    saved = []
    for q in questions:
        q_data = QuestionCreate(
            exam_id=exam_id,
            question_text=q.get("question", ""),
            option_a=q.get("option_a", ""),
            option_b=q.get("option_b", ""),
            option_c=q.get("option_c", ""),
            option_d=q.get("option_d", ""),
            correct_answer=q.get("correct_answer", "A"),
            marks=1.0,
        )
        saved.append(create_question(db, q_data))

    return {
        "message": f"{len(saved)} questions generated and saved for exam #{exam_id}.",
        "questions_saved": len(saved),
    }