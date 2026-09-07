import json
import logging
from time import perf_counter

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

from app.api import auth, exam, question, result, ai
from app.db.database import engine, Base
from app.core.exception import register_exception_handlers

# Import all models so SQLAlchemy creates the tables
from app.models import user, exam as exam_model, question as question_model, result as result_model

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Exam Platform",
    description="Full-stack AI-powered examination system",
    version="2.0.0",
)
@app.get("/health")
def health_check():
    return {"status": "ok"}


class StructuredFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        })


logging.basicConfig(level=logging.INFO, format="%(message)s")
for handler in logging.getLogger().handlers:
    handler.setFormatter(StructuredFormatter())
logger = logging.getLogger(__name__)
register_exception_handlers(app)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    started_at = perf_counter()
    response = await call_next(request)
    duration_ms = (perf_counter() - started_at) * 1000
    logger.info(
        "%s %s -> %s (%.2f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response

import os
from dotenv import load_dotenv

load_dotenv()

# ── CORS ────────────────────────────────────────────────────────────────────
origins_env = os.getenv("CORS_ORIGINS", "")
allow_origins = [orig.strip() for orig in origins_env.split(",") if orig.strip()]
frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url and frontend_url not in allow_origins:
    allow_origins.append(frontend_url)
if not allow_origins:
    allow_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(exam.router)
app.include_router(question.router)
app.include_router(result.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"message": "AI Exam Platform v2.0 Running ✅"}