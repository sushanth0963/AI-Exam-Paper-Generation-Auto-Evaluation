import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      const { access_token, user } = res.data;
      login(access_token, user);
      navigate(user.role === "admin" ? "/admin-dashboard" : "/student-dashboard");
    } catch (err: Error | unknown) {
      setError((err as any)?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <div style={{ width: "100%", maxWidth: 420 }} className="fade-in">
        {/* Header */}
        <div className="text-center mb-3">
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎯</div>
          <h1 className="gradient-text" style={{ fontSize: "1.8rem" }}>AI Exam Platform</h1>
          <p className="mt-1">Sign in to your account</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" className="form-control"
                placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="form-control"
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : "Sign In"}
            </button>
          </form>
          <p className="text-center mt-2 text-muted">
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


