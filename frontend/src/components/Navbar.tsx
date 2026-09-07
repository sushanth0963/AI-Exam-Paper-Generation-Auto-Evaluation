import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span style={{ fontSize: "1.4rem" }}>🎯</span>{" "}
        <span className="gradient-text">AI Exam Platform</span>
      </div>

      <div className="navbar-nav">
        {isAdmin ? (
          <>
            <Link to="/admin-dashboard" className="nav-link">Dashboard</Link>
            <Link to="/create-exam" className="nav-link">Create Exam</Link>
            <Link to="/exam-list" className="nav-link">Exams</Link>
          </>
        ) : (
          <>
            <Link to="/student-dashboard" className="nav-link">Dashboard</Link>
            <Link to="/exam-list" className="nav-link">Exams</Link>
            <Link to="/my-results" className="nav-link">My Results</Link>
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "0.5rem" }}>
          <div style={{
            padding: "0.35rem 0.9rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            fontSize: "0.82rem",
            fontWeight: 600,
          }}>
            {user?.username}{" "}
            <span className={`badge ${isAdmin ? "badge-warning" : "badge-primary"}`}
              style={{ marginLeft: 4 }}>
              {user?.role}
            </span>
          </div>
          <button onClick={logout} className="btn btn-secondary btn-sm">Logout</button>
        </div>
      </div>
    </nav>
  );
}
