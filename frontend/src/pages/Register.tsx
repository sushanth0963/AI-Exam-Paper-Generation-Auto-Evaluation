import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/client";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      navigate("/");
    } catch (err: Error | unknown) {
      setError((err as any)?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <div style={{ width: "100%", maxWidth: 440 }} className="fade-in">
        <div className="text-center mb-3">
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🚀</div>
          <h1 className="gradient-text" style={{ fontSize: "1.8rem" }}>Create Account</h1>
          <p className="mt-1">Join the AI Exam Platform</p>
        </div>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Full Name</label>
              <input id="username" name="username" type="text" className="form-control"
                placeholder="John Doe" value={form.username}
                onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" className="form-control"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="form-control"
                placeholder="Min. 8 characters" value={form.password}
                onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="role">Account Type</label>
              <select id="role" name="role" className="form-control" value={form.role} onChange={handleChange}>
                <option value="student">Student</option>
                <option value="admin">Admin / Instructor</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : "Create Account"}
            </button>
          </form>
          <p className="text-center mt-2 text-muted">
            Already have an account?{" "}
            <Link to="/" style={{ color: "var(--primary)", fontWeight: 600 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


