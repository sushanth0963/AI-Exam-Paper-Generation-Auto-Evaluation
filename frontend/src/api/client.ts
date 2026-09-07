import API from "./axios";

// ── Auth ───────────────────────────────────────────────────────────────────
export const loginUser = (email: string, password: string) => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  return API.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const registerUser = (data: {
  username: string;
  email: string;
  password: string;
  role: string;
}) => API.post("/auth/register", data);

export const getProfile = () => API.get("/auth/profile");

// ── Exams ──────────────────────────────────────────────────────────────────
export const getAllExams = (skip = 0, limit = 20, search = "") =>
  API.get(`/exam/all?skip=${skip}&limit=${limit}&search=${encodeURIComponent(search)}`);

export const getExamById = (id: number) => API.get(`/exam/${id}`);

export const createExam = (data: object) => API.post("/exam/create", data);

export const updateExam = (id: number, data: object) =>
  API.patch(`/exam/${id}`, data);

export const deleteExam = (id: number) => API.delete(`/exam/${id}`);

// ── Questions ──────────────────────────────────────────────────────────────
export const getQuestionsByExam = (examId: number) =>
  API.get(`/questions/exam/${examId}`);

export const getAdminQuestions = (examId: number) =>
  API.get(`/questions/admin/exam/${examId}`);

export const createQuestion = (data: object) =>
  API.post("/questions/create", data);

export const updateQuestion = (id: number, data: object) =>
  API.patch(`/questions/${id}`, data);

export const deleteQuestion = (id: number) =>
  API.delete(`/questions/${id}`);

// ── Results ────────────────────────────────────────────────────────────────
export const submitExam = (data: object) => API.post("/results/submit", data);

export const checkAttempted = (examId: number) =>
  API.get(`/results/check/${examId}`);

export const getMyResults = () => API.get("/results/my");

export const getResultDetail = (resultId: number) =>
  API.get(`/results/detail/${resultId}`);

export const getExamLeaderboard = (examId: number) =>
  API.get(`/results/leaderboard/${examId}`);

export const getExamAnalytics = (examId: number) =>
  API.get(`/results/exam/${examId}`);

// ── AI Question Generation ──────────────────────────────────────────────────
export const generateAIQuestions = (topic: string, examId: number, count = 5) =>
  API.post(`/ai/generate?topic=${encodeURIComponent(topic)}&exam_id=${examId}&count=${count}`);

