import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Lock, Mail, ShieldAlert, ArrowLeft } from "lucide-react";
import RoleSelector from "../components/auth/RoleSelector";
import StudentRegisterForm from "../components/auth/StudentRegisterForm";
import TeacherRegisterForm from "../components/auth/TeacherRegisterForm";
import FormField from "../components/auth/FormField";

const INITIAL_STUDENT_DATA = {
  rollNo: "",
  name: "",
  email: "",
  branchName: "",
  guardianEmail: "",
  guardianPhone: "",
  password: "",
};

const INITIAL_TEACHER_DATA = {
  name: "",
  email: "",
  department: "",
  password: "",
};

const Login = () => {
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  // View state: "login" | "role-select" | "register-form"
  const [view, setView] = useState("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration state
  const [selectedRole, setSelectedRole] = useState(null);
  const [studentData, setStudentData] = useState(INITIAL_STUDENT_DATA);
  const [teacherData, setTeacherData] = useState(INITIAL_TEACHER_DATA);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError("");
    setView("register-form");
  };

  const handleFormChange = (field, value) => {
    if (selectedRole === "STUDENT") {
      setStudentData((prev) => ({ ...prev, [field]: value }));
    } else {
      setTeacherData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const resetRegistration = () => {
    setView("role-select");
    setSelectedRole(null);
    setStudentData(INITIAL_STUDENT_DATA);
    setTeacherData(INITIAL_TEACHER_DATA);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (result.success) {
      navigate(result.role === "TEACHER" ? "/teacher" : "/student");
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData =
      selectedRole === "STUDENT"
        ? { ...studentData, role: "STUDENT" }
        : { ...teacherData, role: "TEACHER" };

    const result = await register(formData);
    setIsSubmitting(false);

    if (result.success) {
      navigate(result.role === "TEACHER" ? "/teacher" : "/student");
    } else {
      setError(result.error);
    }
  };

  const switchToSignUp = () => {
    setError("");
    setView("role-select");
  };

  const switchToLogin = () => {
    setError("");
    setView("login");
    setSelectedRole(null);
    setStudentData(INITIAL_STUDENT_DATA);
    setTeacherData(INITIAL_TEACHER_DATA);
  };

  // -- Determine what heading / subtext to show --
  const getHeading = () => {
    if (view === "login") return "Welcome back";
    if (view === "role-select") return "Create an account";
    return selectedRole === "STUDENT"
      ? "Student Registration"
      : "Teacher Registration";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center -mt-8 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
            <Lock className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {getHeading()}
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Smart Attendance with Geolocation
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start p-3.5 bg-red-50 rounded-xl text-red-700 border border-red-100">
            <ShieldAlert className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* ========== LOGIN VIEW ========== */}
        {view === "login" && (
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <FormField
                label="Email Address"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="student@college.edu"
                icon={Mail}
                required
              />
              <FormField
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                icon={Lock}
                required
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
        )}

        {/* ========== ROLE SELECT VIEW ========== */}
        {view === "role-select" && <RoleSelector onSelect={handleRoleSelect} />}

        {/* ========== REGISTER FORM VIEW ========== */}
        {view === "register-form" && (
          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Back button */}
            <button
              type="button"
              onClick={resetRegistration}
              className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Change role
            </button>

            {selectedRole === "STUDENT" ? (
              <StudentRegisterForm
                formData={studentData}
                onChange={handleFormChange}
              />
            ) : (
              <TeacherRegisterForm
                formData={teacherData}
                onChange={handleFormChange}
              />
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        {/* Toggle Login / Signup */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            {view === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={view === "login" ? switchToSignUp : switchToLogin}
              className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {view === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
