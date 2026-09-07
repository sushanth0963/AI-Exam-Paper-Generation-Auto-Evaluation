import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getMyResults, getExamById } from "../api/client";
import { Result, Exam } from "../types";

export default function MyResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [exams, setExams] = useState<Record<number, Exam>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyResults();
        const resultList: Result[] = res.data;
        setResults(resultList);
        // Fetch exam details for each unique exam_id
        const examIds = [...new Set(resultList.map(r => r.exam_id))];
        const examMap: Record<number, Exam> = {};
        await Promise.all(
          examIds.map(async (id) => {
            const r = await getExamById(id);
            examMap[id] = r.data;
          })
        );
        setExams(examMap);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const avg = results.length
    ? (results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1)
    : "—";
  const best = results.length
    ? Math.max(...results.map(r => r.percentage)).toFixed(1)
    : "—";

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="container">
          <h1 className="mb-1">My <span className="gradient-text">Results</span></h1>
          <p className="mb-3">Your complete exam history</p>

          {/* Stats */}
          <div className="grid grid-4 mb-3">
            {[
              { label: "Exams Taken", value: results.length, icon: "📋" },
              { label: "Avg Score", value: `${avg}%`, icon: "📊" },
              { label: "Best Score", value: `${best}%`, icon: "🏆" },
              { label: "Passed", value: results.filter(r => r.percentage >= 60).length, icon: "✅" },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div style={{ fontSize: "1.6rem" }}>{s.icon}</div>
                <div className="stat-value gradient-text">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center"><div className="spinner" style={{ margin: "0 auto" }} /></div>
          ) : results.length === 0 ? (
            <div className="card text-center">
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
              <h3>No results yet</h3>
              <p className="mt-1">Attempt an exam to see your results here.</p>
              <button className="btn btn-primary mt-2"
                onClick={() => navigate("/student-dashboard")}>
                Browse Exams →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {results.map(r => {
                const exam = exams[r.exam_id];
                const passed = r.percentage >= 60;
                return (
                  <div className="card" key={r.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/result/${r.id}`)}>
                    <div className="flex-between flex-wrap gap-2">
                      <div style={{ flex: 1 }}>
                        <div className="flex-center gap-2 mb-1">
                          <h3>{exam?.title || `Exam #${r.exam_id}`}</h3>
                          <span className={`badge ${passed ? "badge-success" : "badge-danger"}`}>
                            {passed ? "Passed" : "Failed"}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.85rem" }}>
                          {new Date(r.submitted_at).toLocaleString()}
                        </p>
                        <div className="progress mt-2" style={{ maxWidth: 400 }}>
                          <div className="progress-fill"
                            style={{ width: `${r.percentage}%`,
                              background: passed ? "var(--success)" : "var(--danger)" }} />
                        </div>
                      </div>
                      <div className="text-center" style={{ minWidth: 120 }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900,
                          color: passed ? "var(--success)" : "var(--danger)" }}>
                          {r.percentage.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {r.score} / {exam?.total_marks ?? "?"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--success)" }}>✅ {r.correct_answers} correct</span>
                      <span style={{ color: "var(--danger)" }}>❌ {r.wrong_answers} wrong</span>
                      <span>⏭ {r.skipped} skipped</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
