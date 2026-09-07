import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createExam } from "../api/client";

export default function CreateExam() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", topic: "",
    total_marks: "", duration_minutes: "",
    negative_marks: "0", randomize_questions: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const res = await createExam({
        title: form.title,
        description: form.description,
        topic: form.topic,
        total_marks: Number(form.total_marks),
        duration_minutes: Number(form.duration_minutes),
        negative_marks: Number(form.negative_marks),
        randomize_questions: form.randomize_questions,
      });
      setSuccess(`Exam "${res.data.title}" created! Now add questions.`);
      setTimeout(() => navigate(`/add-questions/${res.data.id}`), 1500);
    } catch (err: Error | unknown) {
      setError((err as any)?.response?.data?.detail || "Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="mb-3">
            <h1>Create <span className="gradient-text">New Exam</span></h1>
            <p className="mt-1">Set up the exam metadata. You'll add questions next.</p>
          </div>

          <div className="card">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Exam Title *</label>
                <input name="title" className="form-control" required
                  placeholder="e.g. Python Fundamentals Quiz"
                  value={form.title} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" className="form-control" rows={3}
                  placeholder="What is this exam about?"
                  value={form.description} onChange={handleChange}
                  style={{ resize: "vertical" }} />
              </div>

              <div className="form-group">
                <label>Topic / Category</label>
                <input name="topic" className="form-control"
                  placeholder="e.g. Python, React, Data Science"
                  value={form.topic} onChange={handleChange} />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Total Marks *</label>
                  <input name="total_marks" type="number" min={1} className="form-control" required
                    placeholder="e.g. 100"
                    value={form.total_marks} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input name="duration_minutes" type="number" min={1} className="form-control" required
                    placeholder="e.g. 30"
                    value={form.duration_minutes} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Negative Marks per Wrong Answer</label>
                <input name="negative_marks" type="number" min={0} step={0.25} className="form-control"
                  placeholder="0 = no negative marking"
                  value={form.negative_marks} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input type="checkbox" name="randomize_questions"
                    checked={form.randomize_questions}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: "var(--primary)" }} />
                  <span>Randomize question order for each student</span>
                </label>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : "Create Exam →"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}



