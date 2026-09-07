import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getAllExams, getMyResults, checkAttempted } from "../api/client";
import { Exam, Result } from "../types";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          getAllExams(0, 50, ""),
          getMyResults(),
        ]);
        const examList: Exam[] = examsRes.data;
        const resultList: Result[] = resultsRes.data;
        setExams(examList);
        setResults(resultList);

        // Check attempted status for all exams
        const attemptedMap: Record<number, boolean> = {};
        await Promise.all(
          examList.map(async (exam) => {
            const res = await checkAttempted(exam.id);
            attemptedMap[exam.id] = res.data.attempted;
          })
        );
        setAttempted(attemptedMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = results.length
    ? (results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1)
    : "—";

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="container">
          {/* Welcome Banner */}
          <div className="card mb-3" style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(34,211,238,0.1))",
            border: "1px solid rgba(99,102,241,0.3)"
          }}>
            <div className="flex-between flex-wrap gap-2">
              <div>
                <h1>Welcome back, <span className="gradient-text">{user?.username}</span> 👋</h1>
                <p className="mt-1">Ready to challenge yourself? Pick an exam below.</p>
              </div>
              <div style={{ fontSize: "3.5rem" }}>🎓</div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-4 mb-3">
            {[
              { label: "Exams Available", value: exams.length, icon: "📚" },
              { label: "Attempted", value: Object.values(attempted).filter(Boolean).length, icon: "✅" },
              { label: "Avg Score", value: `${avgScore}%`, icon: "📊" },
              { label: "Best Result", value: results.length ? `${Math.max(...results.map(r => r.percentage)).toFixed(1)}%` : "—", icon: "🏆" },
            ].map((stat, i) => (
              <div className="stat-card" key={i}>
                <div style={{ fontSize: "1.6rem" }}>{stat.icon}</div>
                <div className="stat-value gradient-text">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Exam List */}
          <div className="flex-between mb-2 flex-wrap gap-2">
            <h2>Available Exams</h2>
            <input
              className="form-control"
              style={{ maxWidth: 260 }}
              placeholder="🔍  Search exams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center mt-3"><div className="spinner" style={{ margin: "0 auto" }} /></div>
          ) : filteredExams.length === 0 ? (
            <div className="card text-center"><p>No exams found.</p></div>
          ) : (
            <div className="grid grid-2">
              {filteredExams.map(exam => {
                const done = attempted[exam.id];
                const result = results.find(r => r.exam_id === exam.id);
                return (
                  <div className="card" key={exam.id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div className="flex-between">
                      <span className="badge badge-primary">{exam.topic || "General"}</span>
                      {done && <span className="badge badge-success">✓ Attempted</span>}
                    </div>
                    <h3>{exam.title}</h3>
                    <p>{exam.description || "No description provided."}</p>
                    <div className="flex gap-2 flex-wrap" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      <span>⏱ {exam.duration_minutes} min</span>
                      <span>📝 {exam.total_marks} marks</span>
                      {exam.negative_marks > 0 && <span>⚠️ -{exam.negative_marks} negative</span>}
                    </div>
                    {done && result && (
                      <div className="progress">
                        <div className="progress-fill" style={{ width: `${result.percentage}%` }} />
                      </div>
                    )}
                    {done && result && (
                      <p style={{ fontSize: "0.82rem" }}>Your score: <strong style={{ color: "var(--success)" }}>{result.percentage.toFixed(1)}%</strong></p>
                    )}
                    <div className="flex gap-1 mt-1">
                      {!done ? (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/attempt/${exam.id}`)}>
                          Start Exam →
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/result/${result?.id}`)}>
                          View Result
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/leaderboard/${exam.id}`)}>
                        🏆 Leaderboard
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Results */}
          {results.length > 0 && (
            <div className="mt-3">
              <h2 className="mb-2">Recent Results</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Exam ID</th><th>Score</th><th>Correct</th><th>Wrong</th><th>%</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 5).map(r => (
                      <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/result/${r.id}`)}>
                        <td>#{r.exam_id}</td>
                        <td><strong>{r.score}</strong></td>
                        <td style={{ color: "var(--success)" }}>{r.correct_answers}</td>
                        <td style={{ color: "var(--danger)" }}>{r.wrong_answers}</td>
                        <td>
                          <span className={`badge ${r.percentage >= 60 ? "badge-success" : "badge-danger"}`}>
                            {r.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
