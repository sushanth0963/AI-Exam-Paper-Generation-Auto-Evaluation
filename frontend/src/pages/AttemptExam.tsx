import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getExamById, getQuestionsByExam, checkAttempted, submitExam } from "../api/client";
import { Exam, Question, AnswerSubmission } from "../types";

export default function AttemptExam() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const startedAt = useRef<Date>(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [examRes, attemptedRes] = await Promise.all([
          getExamById(Number(examId)),
          checkAttempted(Number(examId)),
        ]);
        if (attemptedRes.data.attempted) {
          setError("You have already attempted this exam.");
          setLoading(false);
          return;
        }
        const qRes = await getQuestionsByExam(Number(examId));
        setExam(examRes.data);
        setQuestions(qRes.data);
        setTimeLeft(examRes.data.duration_minutes * 60);
      } catch {
        setError("Failed to load exam.");
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examId]);

  const startExam = () => {
    setStarted(true);
    startedAt.current = new Date();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSelect = (questionId: number, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitted || submitting) return;
    if (!autoSubmit && !confirm("Submit exam? This cannot be undone.")) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const payload: { exam_id: number; started_at: string; answers: AnswerSubmission[] } = {
        exam_id: Number(examId),
        started_at: startedAt.current.toISOString(),
        answers: Object.entries(answers).map(([qid, sel]) => ({
          question_id: Number(qid),
          selected_answer: sel,
        })),
      };
      const res = await submitExam(payload);
      setSubmitted(true);
      navigate(`/result/${res.data.result_id}`);
    } catch (err: Error | unknown) {
      setError((err as any)?.response?.data?.detail || "Submission failed");
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const answered = Object.keys(answers).length;
  const q = questions[current];

  if (loading) return (
    <><Navbar /><div className="center"><div className="spinner" /></div></>
  );

  if (error) return (
    <><Navbar />
      <div className="page center" style={{ flexDirection: "column", gap: "1rem" }}>
        <div className="alert alert-error" style={{ maxWidth: 480 }}>{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </>
  );

  if (!started) return (
    <><Navbar />
      <div className="center">
        <div className="card fade-in" style={{ maxWidth: 520, width: "100%" }}>
          <div className="text-center mb-3">
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📝</div>
            <h2>{exam?.title}</h2>
            <p className="mt-1">{exam?.description}</p>
          </div>
          <div className="grid grid-2 mb-3" style={{ gap: "0.75rem" }}>
            {[
              ["⏱ Duration", `${exam?.duration_minutes} minutes`],
              ["📝 Total Marks", `${exam?.total_marks}`],
              ["❓ Questions", `${questions.length}`],
              ["⚠️ Negative Marks", exam?.negative_marks ? `-${exam.negative_marks}/wrong` : "None"],
            ].map(([label, val]) => (
              <div key={label} className="stat-card" style={{ padding: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</div>
                <div style={{ fontWeight: 700, marginTop: "0.25rem" }}>{val}</div>
              </div>
            ))}
          </div>
          <div className="alert alert-info">
            Once you start, the timer begins. Submit before time runs out or it auto-submits.
          </div>
          <button className="btn btn-primary btn-full mt-2" onClick={startExam}>
            🚀 Start Exam
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="container" style={{ maxWidth: 860 }}>
          {/* Sticky Exam Header */}
          <div className="card mb-3" style={{ position: "sticky", top: 72, zIndex: 50 }}>
            <div className="flex-between flex-wrap gap-2">
              <div>
                <h3>{exam?.title}</h3>
                <p style={{ fontSize: "0.82rem" }}>
                  Q{current + 1} of {questions.length} &nbsp;·&nbsp;
                  {answered}/{questions.length} answered
                </p>
              </div>
              <div className="flex gap-2">
                <div className={`timer ${timeLeft < 60 ? "danger" : ""}`}>
                  ⏱ {formatTime(timeLeft)}
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleSubmit(false)} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
            {/* Progress */}
            <div className="progress mt-2">
              <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            {/* Question Panel */}
            <div style={{ flex: 1 }}>
              {q && (
                <div className="card fade-in" key={q.id}>
                  <div className="flex-between mb-2">
                    <span className="badge badge-primary">Question {current + 1}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                  </div>
                  <h3 style={{ marginBottom: "1.5rem", lineHeight: 1.5 }}>{q.question_text}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {(["A","B","C","D"] as const).map(opt => {
                      const text = (q as any)[`option_${opt.toLowerCase()}`];
                      const selected = answers[q.id] === opt;
                      return (
                        <button key={opt}
                          className={`option-btn ${selected ? "selected" : ""}`}
                          onClick={() => handleSelect(q.id, opt)}
                          disabled={submitted}>
                          <span className="option-label">{opt}</span>
                          <span>{text}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-between mt-3">
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => setCurrent(c => Math.max(0, c - 1))}
                      disabled={current === 0}>
                      ← Previous
                    </button>
                    {current < questions.length - 1 ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setCurrent(c => c + 1)}>
                        Next →
                      </button>
                    ) : (
                      <button className="btn btn-success btn-sm" onClick={() => handleSubmit(false)} disabled={submitting}>
                        ✅ Finish
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Question Navigator */}
            <div style={{ width: 180, flexShrink: 0 }}>
              <div className="card card-sm">
                <p style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Navigator
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
                  {questions.map((q2, idx) => (
                    <button key={q2.id}
                      onClick={() => setCurrent(idx)}
                      style={{
                        width: 34, height: 34, borderRadius: 6, border: "none",
                        fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                        background: idx === current
                          ? "var(--primary)"
                          : answers[q2.id]
                          ? "var(--success)"
                          : "var(--surface-hover)",
                        color: (idx === current || answers[q2.id]) ? "#fff" : "var(--text-muted)",
                      }}>
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--success)", display: "inline-block" }} />
                    Answered
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--surface-hover)", display: "inline-block" }} />
                    Not answered
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



