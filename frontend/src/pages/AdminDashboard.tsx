import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getAllExams, getExamAnalytics, deleteExam } from "../api/client";
import { Exam } from "../types";

interface ExamAnalytics {
  total_students?: number;
  average_percentage?: number;
  [key: string]: unknown;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [analytics, setAnalytics] = useState<Record<number, ExamAnalytics | null>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await getAllExams(0, 100, "");
      const list: Exam[] = res.data;
      setExams(list);
      // Fetch analytics for each exam in parallel
      const analyticsData: Record<number, { total_students?: number; average_percentage?: number }> = {};
      await Promise.all(
        list.map(async (exam) => {
          try {
            const r = await getExamAnalytics(exam.id);
            analyticsData[exam.id] = r.data;
          } catch {
            analyticsData[exam.id] = null as unknown as { total_students?: number; average_percentage?: number };
          }
        })
      );
      setAnalytics(analyticsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this exam and all its questions/results?")) return;
    await deleteExam(id);
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = Object.values(analytics).reduce(
    (s, a) => s + (a?.total_students || 0), 0
  );

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="container">
          {/* Header */}
          <div className="card mb-3" style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.08))",
            border: "1px solid rgba(245,158,11,0.25)"
          }}>
            <div className="flex-between flex-wrap gap-2">
              <div>
                <h1>Admin <span className="gradient-text">Dashboard</span> 🛡️</h1>
                <p className="mt-1">Manage exams, questions and view analytics</p>
              </div>
              <button className="btn btn-primary" onClick={() => navigate("/create-exam")}>
                + Create Exam
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-4 mb-3">
            {[
              { label: "Total Exams", value: exams.length, icon: "📋" },
              { label: "Active Exams", value: exams.filter(e => e.is_active).length, icon: "✅" },
              { label: "Total Students", value: totalStudents, icon: "👥" },
              { label: "Avg Participation", value: exams.length ? Math.round(totalStudents / exams.length) : 0, icon: "📈" },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div style={{ fontSize: "1.6rem" }}>{s.icon}</div>
                <div className="stat-value gradient-text">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Exam Table */}
          <div className="flex-between mb-2 flex-wrap gap-2">
            <h2>All Exams</h2>
            <div className="flex gap-1">
              <input className="form-control" style={{ maxWidth: 240 }}
                placeholder="🔍  Search..." value={search}
                onChange={e => setSearch(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={() => navigate("/create-exam")}>
                + New
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center mt-3"><div className="spinner" style={{ margin: "0 auto" }} /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Title</th><th>Topic</th><th>Duration</th>
                    <th>Marks</th><th>Students</th><th>Avg%</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(exam => {
                    const a = analytics[exam.id];
                    return (
                      <tr key={exam.id}>
                        <td style={{ color: "var(--text-muted)" }}>{exam.id}</td>
                        <td><strong>{exam.title}</strong></td>
                        <td>{exam.topic || "—"}</td>
                        <td>{exam.duration_minutes} min</td>
                        <td>{exam.total_marks}</td>
                        <td>{a?.total_students ?? "—"}</td>
                        <td>
                          {a?.average_percentage != null
                            ? <span className={`badge ${a.average_percentage >= 60 ? "badge-success" : "badge-danger"}`}>
                                {a.average_percentage.toFixed(1)}%
                              </span>
                            : "—"}
                        </td>
                        <td>
                          <span className={`badge ${exam.is_active ? "badge-success" : "badge-danger"}`}>
                            {exam.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/add-questions/${exam.id}`)}>
                              ✏️ Questions
                            </button>
                            <button className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/leaderboard/${exam.id}`)}>
                              🏆
                            </button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(exam.id)}>
                              🗑️
                            </button>
                          </div>
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

