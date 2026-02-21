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

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Simple Navbar */}
        {user && (
          <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-indigo-600">
                    GeoAttend
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="mr-4 text-gray-700">
                    Welcome, {user.name}
                  </span>
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/login";
                    }}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="flex-grow">
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
