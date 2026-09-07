from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.main import app
from app.models.user import User
from app.security import hash_password


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.add_all(
        [
            User(
                username="Test Admin",
                email="admin@test.local",
                password=hash_password("admin-password"),
                role="admin",
                is_active=True,
            ),
            User(
                username="Test Student",
                email="student@test.local",
                password=hash_password("student-password"),
                role="student",
                is_active=True,
            ),
        ]
    )
    db.commit()
    db.close()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def token(client, email, password):
    response = client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_header(access_token):
    return {"Authorization": f"Bearer {access_token}"}


def test_root_and_auth_routes(client):
    assert client.get("/").status_code == 200
    assert client.get("/auth/test").status_code == 200
    registered = client.post(
        "/auth/register",
        json={
            "username": "Registered User",
            "email": "registered@test.local",
            "password": "registered-password",
        },
    )
    assert registered.status_code == 200

    invalid = client.post(
        "/auth/login",
        data={"username": "admin@test.local", "password": "wrong"},
    )
    assert invalid.status_code == 401

    profile = client.get(
        "/auth/profile",
        headers=auth_header(token(client, "student@test.local", "student-password")),
    )
    assert profile.status_code == 200
    assert profile.json()["user"] == "student@test.local"


def test_admin_exam_question_and_ai_routes(client, monkeypatch):
    admin_headers = auth_header(token(client, "admin@test.local", "admin-password"))
    student_headers = auth_header(token(client, "student@test.local", "student-password"))
    exam_payload = {
        "title": "API Test Exam",
        "description": "test",
        "topic": "FastAPI",
        "total_marks": 1,
        "duration_minutes": 10,
    }

    assert client.post("/exam/create", json=exam_payload, headers=student_headers).status_code == 403
    exam = client.post("/exam/create", json=exam_payload, headers=admin_headers)
    assert exam.status_code == 201
    exam_id = exam.json()["id"]
    assert client.get("/exam/all", headers=student_headers).status_code == 200
    assert client.get(f"/exam/{exam_id}", headers=student_headers).status_code == 200
    assert client.patch(
        f"/exam/{exam_id}",
        json={"title": "Updated"},
        headers=admin_headers,
    ).status_code == 200

    question = client.post(
        "/questions/create",
        json={
            "exam_id": exam_id,
            "question_text": "What is FastAPI?",
            "option_a": "A framework",
            "option_b": "A database",
            "option_c": "A queue",
            "option_d": "A shell",
            "correct_answer": "A",
            "marks": 1,
        },
        headers=admin_headers,
    )
    assert question.status_code == 201
    question_id = question.json()["id"]
    assert client.get(f"/questions/exam/{exam_id}", headers=student_headers).status_code == 200
    assert client.get(f"/questions/admin/exam/{exam_id}", headers=admin_headers).status_code == 200
    assert client.patch(
        f"/questions/{question_id}",
        json={"marks": 2},
        headers=admin_headers,
    ).status_code == 200

    monkeypatch.setattr(
        "app.api.ai.generate_questions",
        lambda topic, count: [{
            "question": "Generated?",
            "option_a": "Yes",
            "option_b": "No",
            "option_c": "Maybe",
            "option_d": "Later",
            "correct_answer": "A",
        }],
    )
    assert client.post(
        f"/ai/generate?topic=FastAPI&exam_id={exam_id}&count=1",
        headers=student_headers,
    ).status_code == 403
    assert client.post(
        f"/ai/generate?topic=FastAPI&exam_id={exam_id}&count=1",
        headers=admin_headers,
    ).status_code == 200

    submission = client.post(
        "/results/submit",
        json={
            "exam_id": exam_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "answers": [{"question_id": question_id, "selected_answer": "A"}],
        },
        headers=student_headers,
    )
    assert submission.status_code == 200
    result_id = submission.json()["id"]
    assert client.get(f"/results/detail/{result_id}", headers=student_headers).status_code == 200
    assert client.get(f"/results/exam/{exam_id}", headers=admin_headers).status_code == 200
    assert client.delete(f"/questions/{question_id}", headers=admin_headers).status_code == 204
    assert client.delete(f"/exam/{exam_id}", headers=admin_headers).status_code == 204


def test_result_routes_and_validation_errors(client):
    student_headers = auth_header(token(client, "student@test.local", "student-password"))
    assert client.get("/results/my", headers=student_headers).status_code == 200
    assert client.get("/results/leaderboard/999", headers=student_headers).status_code == 200
    assert client.get("/results/check/999", headers=student_headers).status_code == 200

    validation = client.post("/auth/register", json={"email": "invalid"})
    assert validation.status_code == 422
    assert validation.json()["detail"] == "Request validation failed"

    missing_auth = client.get("/exam/all")
    assert missing_auth.status_code == 401
