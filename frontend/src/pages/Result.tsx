import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getResultDetail, getExamById } from "../api/client";
import { Result, Exam } from "../types";

export default function ResultPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<Result | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getResultDetail(Number(resultId));
        setResult(res.data);
        const examRes = await getExamById(res.data.exam_id);
        setExam(examRes.data);
      } finally { setLoading(false); }
    };
    load();
  }, [resultId]);

  if (loading) return <><Navbar /><div className="center"><div className="spinner" /></div></>;
  if (!result) return <><Navbar /><div className="page"><div className="alert alert-error">Result not found.</div></div></>;

  const passed = result.percentage >= 60;
  const timeTaken = Math.round(
    (new Date(result.submitted_at).getTime() - new Date(result.started_at).getTime()) / 60000
  );

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="container" style={{ maxWidth: 760 }}>
          {/* Score Hero */}
          <div className="card mb-3 text-center" style={{
            background: passed
              ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,78,59,0.1))"
              : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(127,29,29,0.1))",
            border: `1px solid ${passed ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>
              {passed ? "🏆" : "📚"}
            </div>
            <h1 style={{ color: passed ? "var(--success)" : "var(--danger)" }}>
              {passed ? "Congratulations!" : "Keep Practising!"}
            </h1>
            <p className="mt-1">{exam?.title}</p>
            <div style={{ fontSize: "4.5rem", fontWeight: 900, margin: "1rem 0",
              color: passed ? "var(--success)" : "var(--danger)" }}>
              {result.percentage.toFixed(1)}%
            </div>
            <div className="progress" style={{ maxWidth: 400, margin: "0 auto" }}>
              <div className="progress-fill" style={{ width: `${result.percentage}%`,
                background: passed ? "var(--success)" : "var(--danger)" }} />
            </div>
            <p className="mt-2" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Score: {result.score} / {exam?.total_marks}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-4 mb-3">
            {[
              { label: "Correct", value: result.correct_answers, icon: "✅", color: "var(--success)" },
              { label: "Wrong", value: result.wrong_answers, icon: "❌", color: "var(--danger)" },
              { label: "Skipped", value: result.skipped, icon: "⏭️", color: "var(--warning)" },
              { label: "Time Taken", value: `${timeTaken}m`, icon: "⏱", color: "var(--accent)" },
            ].map((s, i) => (
              <div className="stat-card text-center" key={i}>
                <div style={{ fontSize: "1.6rem" }}>{s.icon}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Visual Breakdown */}
          <div className="card mb-3">
            <h3 className="mb-2">Performance Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "Correct Answers", value: result.correct_answers, total: result.total_questions, color: "var(--success)" },
                { label: "Wrong Answers", value: result.wrong_answers, total: result.total_questions, color: "var(--danger)" },
                { label: "Skipped", value: result.skipped, total: result.total_questions, color: "var(--warning)" },
              ].map((row, i) => (
                <div key={i}>
                  <div className="flex-between mb-1" style={{ fontSize: "0.85rem" }}>
                    <span>{row.label}</span>
                    <span style={{ fontWeight: 700 }}>{row.value} / {row.total}</span>
                  </div>
                  <div className="progress">
                    <div className="progress-fill" style={{
                      width: `${row.total > 0 ? (row.value / row.total) * 100 : 0}%`,
                      background: row.color,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Table */}
          <div className="card mb-3">
            <h3 className="mb-2">Summary</h3>
            <div className="table-wrap">
              <table>
                <tbody>
                  {[
                    ["Exam", exam?.title],
                    ["Total Questions", result.total_questions],
                    ["Your Score", `${result.score} / ${exam?.total_marks}`],
                    ["Percentage", `${result.percentage.toFixed(2)}%`],
                    ["Result", passed ? "PASSED ✅" : "FAILED ❌"],
                    ["Submitted At", new Date(result.submitted_at).toLocaleString()],
                  ].map(([k, v]) => (
                    <tr key={String(k)}>
                      <td style={{ color: "var(--text-muted)", width: 160 }}>{k}</td>
                      <td style={{ fontWeight: 600 }}>{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary" onClick={() => navigate(`/leaderboard/${result.exam_id}`)}>
              🏆 View Leaderboard
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/student-dashboard")}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
