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
        {/* Simple Navbar */}
        {user && (
          <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-14">
                <div className="flex items-center">
                  <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                    GeoAttend
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/login";
                    }}
                    className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
