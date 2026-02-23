import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import { GlobalLoader } from "./components/GlobalLoader";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading)
    return (
      <GlobalLoader fullScreen={true} message="Verifying authentication..." />
    );

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <main className="flex-1 w-full flex flex-col">
          <Routes>
            <Route
              path="/login"
              element={
                user && user.role === "TEACHER" ? (
                  <Navigate to="/teacher" />
                ) : user && user.role === "STUDENT" ? (
                  <Navigate to="/student" />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/teacher"
              element={
                <PrivateRoute roles={["TEACHER"]}>
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/student"
              element={
                <PrivateRoute roles={["STUDENT"]}>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
