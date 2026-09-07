import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getExamLeaderboard, getExamById } from "../api/client";
import { LeaderboardEntry, Exam } from "../types";
import { useAuth } from "../context/AuthContext";

export default function Leaderboard() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [lbRes, examRes] = await Promise.all([
          getExamLeaderboard(Number(examId)),
          getExamById(Number(examId)),
        ]);
        setEntries(lbRes.data.leaderboard);
        setExam(examRes.data);
      } finally { setLoading(false); }
    };
    load();
  }, [examId]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="flex-between mb-3 flex-wrap gap-2">
            <div>
              <h1>🏆 <span className="gradient-text">Leaderboard</span></h1>
              <p className="mt-1">{exam?.title}</p>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
          </div>

          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="flex gap-2 mb-3 flex-wrap" style={{ justifyContent: "center" }}>
              {[entries[1], entries[0], entries[2]].map((e, i) => {

                const pos = [2, 1, 3];
                return (
                  <div key={e.user_id} className="card text-center"
                    style={{ flex: "0 0 160px", paddingTop: "1rem",
                      borderColor: i === 1 ? "rgba(245,158,11,0.4)" : "var(--border)",
                      background: i === 1 ? "rgba(245,158,11,0.08)" : "var(--surface)" }}>
                    <div style={{ fontSize: "2.5rem" }}>{medals[pos[i] - 1]}</div>
                    <div style={{ fontWeight: 700, marginTop: "0.4rem" }}>{e.username}</div>
                    <div style={{ color: "var(--success)", fontWeight: 800, fontSize: "1.3rem" }}>
                      {e.percentage.toFixed(1)}%
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Score: {e.score}</div>
                    <div style={{ marginTop: "0.5rem" }}>
                      <span className={`badge ${i === 1 ? "badge-warning" : "badge-primary"}`}>
                        #{pos[i]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          {loading ? (
            <div className="text-center"><div className="spinner" style={{ margin: "0 auto" }} /></div>
          ) : entries.length === 0 ? (
            <div className="card text-center"><p>No attempts yet. Be the first!</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const isMe = e.user_id === user?.id;
                    return (
                      <tr key={e.user_id} style={{
                        background: isMe ? "rgba(99,102,241,0.08)" : undefined,
                        borderLeft: isMe ? "3px solid var(--primary)" : undefined,
                      }}>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                            {medals[e.rank - 1] || `#${e.rank}`}
                          </span>
                        </td>
                        <td>
                          <strong>{e.username}</strong>
                          {isMe && <span className="badge badge-primary" style={{ marginLeft: 8 }}>You</span>}
                        </td>
                        <td style={{ fontWeight: 700 }}>{e.score}</td>
                        <td>
                          <span className={`badge ${e.percentage >= 60 ? "badge-success" : "badge-danger"}`}>
                            {e.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {new Date(e.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
