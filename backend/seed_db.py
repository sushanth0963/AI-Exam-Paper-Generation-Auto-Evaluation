import sys
import os
from sqlalchemy.orm import Session

# Add the parent directory to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question
from app.models.result import Result
from app.security import hash_password
import json
from datetime import datetime, timedelta

def seed():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(User).count() > 0:
            print("Database already has users. Skipping seeding.")
            return

        print("Seeding database...")

        # 1. Create Users
        admin = User(
            username="Admin Instructor",
            email="admin@example.com",
            password=hash_password("adminpass"),
            role="admin",
            is_active=True
        )
        student = User(
            username="Student User",
            email="student@example.com",
            password=hash_password("studentpass"),
            role="student",
            is_active=True
        )
        alice = User(
            username="Alice Smith",
            email="alice@example.com",
            password=hash_password("alicepass"),
            role="student",
            is_active=True
        )
        bob = User(
            username="Bob Jones",
            email="bob@example.com",
            password=hash_password("bobpass"),
            role="student",
            is_active=True
        )

        db.add_all([admin, student, alice, bob])
        db.commit()
        db.refresh(admin)
        db.refresh(student)
        db.refresh(alice)
        db.refresh(bob)

        print(f"Created users: {admin.email}, {student.email}, {alice.email}, {bob.email}")

        # 2. Create Exam 1: React Hooks Mastery
        exam_react = Exam(
            title="React Hooks Mastery",
            description="Test your deep understanding of React Hooks including useState, useEffect, useMemo, custom hooks, and rules of hooks.",
            topic="React",
            total_marks=5,
            duration_minutes=10,
            negative_marks=0.25,
            is_active=True,
            randomize_questions=False,
            created_by=admin.id
        )
        
        db.add(exam_react)
        db.commit()
        db.refresh(exam_react)

        # Questions for React
        q_react = [
            Question(
                exam_id=exam_react.id,
                question_text="Which hook should be used to perform side effects in a functional component?",
                option_a="useState",
                option_b="useReducer",
                option_c="useEffect",
                option_d="useCallback",
                correct_answer="C",
                marks=1.0
            ),
            Question(
                exam_id=exam_react.id,
                question_text="What happens if you pass an empty array [] as the dependency list in useEffect?",
                option_a="The effect runs on every render.",
                option_b="The effect runs only once after the initial render.",
                option_c="The effect never runs.",
                option_d="The effect runs when the component updates.",
                correct_answer="B",
                marks=1.0
            ),
            Question(
                exam_id=exam_react.id,
                question_text="Which hook returns a mutable ref object whose .current property is initialized to the passed argument?",
                option_a="useRef",
                option_b="useMemo",
                option_c="useContext",
                option_d="useState",
                correct_answer="A",
                marks=1.0
            ),
            Question(
                exam_id=exam_react.id,
                question_text="How can you optimize performance by memoizing the result of a expensive calculation?",
                option_a="useCallback",
                option_b="useMemo",
                option_c="useEffect",
                option_d="useRef",
                correct_answer="B",
                marks=1.0
            ),
            Question(
                exam_id=exam_react.id,
                question_text="Which of the following is a Rule of Hooks?",
                option_a="Only call hooks inside loops.",
                option_b="Only call hooks from React function components or custom hooks.",
                option_c="Call hooks inside nested functions.",
                option_d="Call hooks conditionally.",
                correct_answer="B",
                marks=1.0
            )
        ]
        db.add_all(q_react)
        db.commit()

        # 3. Create Exam 2: FastAPI Fundamentals
        exam_fastapi = Exam(
            title="FastAPI Fundamentals",
            description="Evaluate your knowledge of FastAPI routing, dependency injection, async endpoints, and Pydantic validation schemas.",
            topic="FastAPI",
            total_marks=5,
            duration_minutes=15,
            negative_marks=0.0,
            is_active=True,
            randomize_questions=False,
            created_by=admin.id
        )
        db.add(exam_fastapi)
        db.commit()
        db.refresh(exam_fastapi)

        # Questions for FastAPI
        q_fastapi = [
            Question(
                exam_id=exam_fastapi.id,
                question_text="Which tool does FastAPI use for data validation and settings management?",
                option_a="Flask",
                option_b="Django",
                option_c="Pydantic",
                option_d="SQLAlchemy",
                correct_answer="C",
                marks=1.0
            ),
            Question(
                exam_id=exam_fastapi.id,
                question_text="How do you declare a path parameter in a FastAPI endpoint route?",
                option_a="Using query params like /items?item_id=...",
                option_b="Using curly braces in path like /items/{item_id}",
                option_c="Using square brackets like /items/[item_id]",
                option_d="Via request body parameter.",
                correct_answer="B",
                marks=1.0
            ),
            Question(
                exam_id=exam_fastapi.id,
                question_text="FastAPI is built on top of which two major ASGI/Web libraries?",
                option_a="Starlette and Pydantic",
                option_b="Flask and Jinja2",
                option_c="Tornado and Twisted",
                option_d="Django and Channels",
                correct_answer="A",
                marks=1.0
            ),
            Question(
                exam_id=exam_fastapi.id,
                question_text="Which parameter or utility is used to implement Dependency Injection in FastAPI routers?",
                option_a="Inject",
                option_b="Depends",
                option_c="Provide",
                option_d="Service",
                correct_answer="B",
                marks=1.0
            ),
            Question(
                exam_id=exam_fastapi.id,
                question_text="Does FastAPI natively support asynchronous endpoint handlers using 'async def'?",
                option_a="Yes, fully natively.",
                option_b="No, requires a third party celery worker.",
                option_c="Only for Postgres databases.",
                option_d="Only inside WebSocket connections.",
                correct_answer="A",
                marks=1.0
            )
        ]
        db.add_all(q_fastapi)
        db.commit()

        print("Created exams and questions successfully.")

        # 4. Create Mock Results (to populate My Results and Leaderboard)
        # Alice scored 5.0 (100%) on React Hooks
        ans_alice = {"1": "C", "2": "B", "3": "A", "4": "B", "5": "B"}
        result_alice = Result(
            user_id=alice.id,
            exam_id=exam_react.id,
            score=5.0,
            total_questions=5,
            correct_answers=5,
            wrong_answers=0,
            skipped=0,
            percentage=100.0,
            started_at=datetime.utcnow() - timedelta(minutes=15),
            submitted_at=datetime.utcnow() - timedelta(minutes=7),
            answers_json=json.dumps(ans_alice)
        )

        # Bob scored 3.75 (3 correct, 1 wrong, 1 skipped) on React Hooks
        # Note: 3.0 correct - 0.25 wrong = 2.75 marks
        ans_bob = {"1": "C", "2": "B", "3": "C", "4": "", "5": "B"}
        result_bob = Result(
            user_id=bob.id,
            exam_id=exam_react.id,
            score=2.75,
            total_questions=5,
            correct_answers=3,
            wrong_answers=1,
            skipped=1,
            percentage=55.0,
            started_at=datetime.utcnow() - timedelta(minutes=20),
            submitted_at=datetime.utcnow() - timedelta(minutes=12),
            answers_json=json.dumps(ans_bob)
        )

        # Student scored 4.0 (4 correct, 0 wrong, 1 skipped) on React Hooks = 4.0 marks
        ans_student = {"1": "C", "2": "B", "3": "A", "4": "B", "5": ""}
        result_student = Result(
            user_id=student.id,
            exam_id=exam_react.id,
            score=4.0,
            total_questions=5,
            correct_answers=4,
            wrong_answers=0,
            skipped=1,
            percentage=80.0,
            started_at=datetime.utcnow() - timedelta(minutes=10),
            submitted_at=datetime.utcnow() - timedelta(minutes=5),
            answers_json=json.dumps(ans_student)
        )

        db.add_all([result_alice, result_bob, result_student])
        db.commit()

        print("Mock results seeded successfully.")
        print("Database fully seeded! 🎉")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
