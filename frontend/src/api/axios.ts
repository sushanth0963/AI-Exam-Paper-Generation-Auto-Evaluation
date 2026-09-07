import axios from "axios";

/**
 * Axios instance pre-configured for the AI Exam Platform API.
 * Automatically attaches JWT token from localStorage on every request.
 * Redirects to login on 401 Unauthorized.
 */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://ai-exam-paper-generation-auto-evaluation.onrender.com",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach token ──────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ──────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;