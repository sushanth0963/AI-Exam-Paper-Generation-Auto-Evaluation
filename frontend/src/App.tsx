import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute, StudentRoute } from "./routes/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateExam from "./pages/CreateExam";
import AddQuestions from "./pages/AddQuestions";
import AttemptExam from "./pages/AttemptExam";
import Result from "./pages/Result";
import MyResults from "./pages/MyResults";
import Leaderboard from "./pages/Leaderboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student routes */}
          <Route path="/student-dashboard" element={
            <StudentRoute><StudentDashboard /></StudentRoute>
          } />
          <Route path="/attempt/:examId" element={
            <ProtectedRoute><AttemptExam /></ProtectedRoute>
          } />
          <Route path="/result/:resultId" element={
            <ProtectedRoute><Result /></ProtectedRoute>
          } />
          <Route path="/my-results" element={
            <StudentRoute><MyResults /></StudentRoute>
          } />
          <Route path="/leaderboard/:examId" element={
            <ProtectedRoute><Leaderboard /></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin-dashboard" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/create-exam" element={
            <AdminRoute><CreateExam /></AdminRoute>
          } />
          <Route path="/add-questions/:examId" element={
            <AdminRoute><AddQuestions /></AdminRoute>
          } />

          {/* Legacy redirect */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* 404 */}
          <Route path="*" element={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
              height: "100vh", flexDirection: "column", gap: "1rem" }}>
              <div style={{ fontSize: "4rem" }}>🔍</div>
              <h2>Page Not Found</h2>
              <a href="/" style={{ color: "var(--primary)" }}>Go Home</a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;