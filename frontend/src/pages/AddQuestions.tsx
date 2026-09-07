import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getExamById, getAdminQuestions, createQuestion, updateQuestion, deleteQuestion, generateAIQuestions } from "../api/client";
import { Exam, Question } from "../types";

interface QuestionForm {
  question_text: string;
  option_a: string; option_b: string;
  option_c: string; option_d: string;
  correct_answer: string; marks: string;
}

const emptyForm: QuestionForm = {
  question_text: "", option_a: "", option_b: "",
  option_c: "", option_d: "", correct_answer: "A", marks: "1",
};

export default function AddQuestions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI states
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");
  const [aiCount, setAiCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuccess, setAiSuccess] = useState("");
  const [aiError, setAiError] = useState("");

  const loadData = async () => {
    try {
      const [examRes, qRes] = await Promise.all([
        getExamById(Number(examId)),
        getAdminQuestions(Number(examId)),
      ]);
      setExam(examRes.data);
      setQuestions(qRes.data);
    } finally { setLoading(false); }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError("");
    setAiSuccess("");
    setAiGenerating(true);
    try {
      const topic = exam?.topic || "General Knowledge";
      const res = await generateAIQuestions(topic, Number(examId), aiCount);
      if (res.data.error) {
        setAiError(res.data.error);
      } else {
        setAiSuccess(res.data.message || `Successfully generated and saved ${aiCount} questions!`);
        await loadData();
        // Switch back to manual/view list to see the generated questions
        setTimeout(() => {
          setActiveTab("manual");
          setAiSuccess("");
        }, 2000);
      }
    } catch (err: Error | unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setAiError(error.response?.data?.detail || "Failed to generate AI questions. Make sure the backend is active.");
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      if (editId) {
        await updateQuestion(editId, { ...form, marks: Number(form.marks) });
      } else {
        await createQuestion({ ...form, exam_id: Number(examId), marks: Number(form.marks) });
      }
      setForm(emptyForm); setEditId(null);
      await loadData();
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.detail || "Failed to save question");
    } finally { setSaving(false); }
  };

  const handleEdit = (q: Question) => {
    setEditId(q.id);
    setForm({
      question_text: q.question_text, option_a: q.option_a,
      option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
      correct_answer: q.correct_answer || "A", marks: String(q.marks),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    await deleteQuestion(id);
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="container">
          <div className="flex-between mb-3 flex-wrap gap-2">
            <div>
              <h1>Questions for <span className="gradient-text">{exam?.title}</span></h1>
              <p className="mt-1">{questions.length} question(s) added · {exam?.total_marks} total marks</p>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate("/admin-dashboard")}>
              ← Back
            </button>
          </div>

          {/* Tabs Switcher */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button
              type="button"
              className={`btn ${activeTab === "manual" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => { setActiveTab("manual"); setAiSuccess(""); setAiError(""); }}
              style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", fontWeight: 600, border: activeTab === "manual" ? "none" : "1px solid var(--border)" }}
            >
              ✍️ Add Question Manually
            </button>
            <button
              type="button"
              className={`btn ${activeTab === "ai" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => { setActiveTab("ai"); setError(""); }}
              style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", fontWeight: 600, border: activeTab === "ai" ? "none" : "1px solid var(--border)" }}
            >
              🪄 Auto-Generate with AI
            </button>
          </div>

          {/* AI Generator Card */}
          {activeTab === "ai" && (
            <div className="card mb-3" style={{ border: "1px dashed var(--primary)", background: "rgba(99,102,241,0.03)" }}>
              <h3 className="mb-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🪄 AI Question Generator</span>
                <span className="badge badge-primary" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}>Interactive</span>
              </h3>
              <p className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Automatically generate high-quality multiple choice questions based on the exam's topic:{" "}
                <strong style={{ color: "var(--primary)" }}>{exam?.topic || "General"}</strong>.
              </p>

              {aiError && <div className="alert alert-error">{aiError}</div>}
              {aiSuccess && <div className="alert alert-success">{aiSuccess}</div>}

              <form onSubmit={handleAIGenerate}>
                <div className="form-group">
                  <label>Number of Questions to Generate</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="form-control"
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    required
                  />
                  <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                    Select between 1 and 20 questions. Each question is automatically worth 1.0 mark.
                  </small>
                </div>

                <div className="flex gap-2 mt-2">
                  <button type="submit" className="btn btn-primary" disabled={aiGenerating} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {aiGenerating ? (
                      <>
                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        <span>AI is writing questions...</span>
                      </>
                    ) : (
                      <span>Generate Questions ✨</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add/Edit Form */}
          {activeTab === "manual" && (
            <div className="card mb-3">
              <h3 className="mb-2">{editId ? "✏️ Edit Question" : "➕ Add Question"}</h3>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Question Text *</label>
                  <textarea name="question_text" className="form-control" rows={3} required
                    placeholder="Enter the question..." value={form.question_text}
                    onChange={handleChange} style={{ resize: "vertical" }} />
                </div>
                <div className="grid grid-2">
                  {(["a","b","c","d"] as const).map(opt => (
                    <div className="form-group" key={opt}>
                      <label>Option {opt.toUpperCase()} *</label>
                      <input name={`option_${opt}`} className="form-control" required
                        placeholder={`Option ${opt.toUpperCase()}`}
                        value={(form as any)[`option_${opt}`]} onChange={handleChange} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>Correct Answer *</label>
                    <select name="correct_answer" className="form-control" value={form.correct_answer} onChange={handleChange}>
                      {["A","B","C","D"].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marks for this Question</label>
                    <input name="marks" type="number" min={0.5} step={0.5} className="form-control"
                      value={form.marks} onChange={handleChange} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : editId ? "Update Question" : "Add Question"}
                  </button>
                  {editId && (
                    <button type="button" className="btn btn-secondary"
                      onClick={() => { setEditId(null); setForm(emptyForm); }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Questions List */}
          {loading ? (
            <div className="text-center"><div className="spinner" style={{ margin: "0 auto" }} /></div>
          ) : questions.length === 0 ? (
            <div className="card text-center"><p>No questions yet. Add your first question above.</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {questions.map((q, idx) => (
                <div className="card card-sm" key={q.id}>
                  <div className="flex-between mb-1">
                    <span style={{ fontWeight: 700, color: "var(--primary)" }}>Q{idx + 1}</span>
                    <div className="flex gap-1">
                      <span className="badge badge-primary">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                      <span className="badge badge-success">Answer: {q.correct_answer}</span>
                    </div>
                  </div>
                  <p style={{ color: "var(--text)", marginBottom: "0.75rem", fontWeight: 500 }}>{q.question_text}</p>
                  <div className="grid grid-2" style={{ fontSize: "0.85rem", color: "var(--text-muted)", gap: "0.4rem" }}>
                    {(["a","b","c","d"] as const).map(opt => (
                      <div key={opt} style={{
                        padding: "0.4rem 0.75rem", borderRadius: 6,
                        background: q.correct_answer === opt.toUpperCase() ? "rgba(16,185,129,0.12)" : "var(--surface)",
                        border: `1px solid ${q.correct_answer === opt.toUpperCase() ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                        color: q.correct_answer === opt.toUpperCase() ? "var(--success)" : "var(--text-muted)",
                      }}>
                        <strong>{opt.toUpperCase()}.</strong> {(q as any)[`option_${opt}`]}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(q)}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}




