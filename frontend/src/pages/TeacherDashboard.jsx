import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api";
import {
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ArrowLeft,
  XCircle,
} from "lucide-react";

const TeacherDashboard = () => {
  const [session, setSession] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [subject, setSubject] = useState("");
  const [activeTab, setActiveTab] = useState("session"); // 'session' or 'history'

  // History state
  const [subjects, setSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);

  // Fetch active session on load
  const fetchSessionData = async () => {
    try {
      const res = await api.get("/session/active");
      if (res.data.session) {
        setSession(res.data.session);
        fetchAttendees(res.data.session.id);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
    }
  };

  const fetchAttendees = async (sessionId) => {
    try {
      const res = await api.get(`/session/${sessionId}/attendance`);
      setAttendees(res.data.attendees);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/session/history");
      setSubjects(res.data.subjects || []);
      setAllStudents(res.data.allStudents || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchSessionData();
    fetchHistory();
    // Poll for attendees every 10 seconds if session is active
    const interval = setInterval(() => {
      if (session) {
        fetchAttendees(session.id);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [session?.id]);

  const startSession = () => {
    setLoading(true);
    setError("");
    setLocationStatus("Acquiring high-accuracy GPS location...");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLocationStatus("GPS acquired. Starting session...");

          const res = await api.post("/session/start", {
            latitude,
            longitude,
            subject: subject || "General",
          });
          setSession(res.data.session);
          setAttendees([]);
          setLocationStatus("");
          setSubject("");
        } catch (err) {
          setError(err.response?.data?.error || "Failed to start session.");
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setError(geoError.message || "Location access denied or unavailable.");
        setLoading(false);
        setLocationStatus("");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const endSession = async () => {
    if (!session) return;
    try {
      await api.post("/session/end", { sessionId: session.id });
      setSession(null);
      if (activeTab === "history") fetchHistory(); // Refresh history after ending
    } catch (err) {
      console.error("Failed to end session");
    }
  };

  const handleOverride = async (sessionId, studentId, currentStatus) => {
    try {
      const newStatus = currentStatus === "PRESENT" ? "ABSENT" : "PRESENT";
      await api.post("/session/override", {
        sessionId,
        studentId,
        status: newStatus,
      });
      fetchHistory(); // refresh data
    } catch (err) {
      console.error("Failed to override attendance", err);
      setError("Failed to override attendance");
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Teacher Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {session ? (
            <button
              onClick={endSession}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              End Active Session
            </button>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("session");
              setSelectedSubject(null);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "session" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <MapPin className="inline w-4 h-4 mr-1 -mt-0.5" /> Active Session
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setSelectedSubject(null);
              fetchHistory();
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "history" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <Clock className="inline w-4 h-4 mr-1 -mt-0.5" /> Subject Analytics
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 p-4 border-l-4 border-red-400 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {locationStatus && (
        <div className="bg-blue-50 p-4 border-l-4 border-blue-400 mb-6">
          <p className="text-blue-700 animate-pulse">{locationStatus}</p>
        </div>
      )}

      {/* ───────── ACTIVE SESSION TAB ───────── */}
      {activeTab === "session" && (
        <div className="animation-fade-in">
          {session ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* QR Code Panel */}
              <div className="lg:col-span-5 bg-white shadow-sm border border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>

                <h3 className="text-xl font-extrabold text-gray-900 mb-2 flex items-center tracking-tight">
                  <MapPin className="mr-2 text-indigo-500 w-6 h-6" /> Live
                  Session
                </h3>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700 mb-8">
                  {session.subject}
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] mb-8 border border-gray-100 transform transition-transform hover:scale-105 duration-300">
                  <QRCodeSVG
                    value={session.id}
                    size={280}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-sm font-medium text-gray-500 text-center px-4 max-w-xs">
                  Students must scan this code using their GeoAttend app while
                  in the classroom.
                </p>
              </div>

              {/* Attendees Panel */}
              <div className="lg:col-span-7 bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Users className="mr-2 text-indigo-500 w-5 h-5" /> Verified
                    Attendees
                  </h3>
                  <div className="flex items-center">
                    <span className="relative flex h-3 w-3 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                      {attendees.length} Present
                    </span>
                  </div>
                </div>
                <div
                  className="flex-1 overflow-y-auto bg-gray-50/30"
                  style={{ maxHeight: "600px" }}
                >
                  <ul className="divide-y divide-gray-100">
                    {attendees.length === 0 ? (
                      <li className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          Waiting for students to start scanning...
                        </p>
                      </li>
                    ) : (
                      attendees.map((record) => (
                        <li
                          key={record.id}
                          className="px-6 py-4 hover:bg-white transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-inner border border-indigo-100">
                                {record.student.name.charAt(0).toUpperCase()}
                              </span>
                              <div className="ml-4">
                                <p className="text-sm font-bold text-gray-900">
                                  {record.student.name}
                                </p>
                                <p className="text-xs font-medium text-gray-500">
                                  {record.student.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                Verified
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-white shadow-sm border border-gray-100 rounded-2xl max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Start a New Session
              </h3>
              <p className="mt-2 text-md text-gray-500 mb-8 max-w-sm mx-auto">
                Enter your subject name to generate a unique geolocation-locked
                QR code for your students.
              </p>
              <div className="max-w-sm mx-auto space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Data Structures, React 101"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm font-medium transition-shadow"
                  />
                </div>
                <button
                  onClick={startSession}
                  disabled={loading || !subject.trim()}
                  className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Starting Session...
                    </>
                  ) : (
                    "Generate Session QR"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────── SUBJECT ANALYTICS / HISTORY TAB ───────── */}
      {activeTab === "history" && (
        <div className="space-y-8 animation-fade-in">
          {subjects.length === 0 ? (
            <div className="text-center py-20 bg-white shadow-sm border border-gray-100 rounded-2xl">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="h-10 w-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                No Subjects Found
              </h3>
              <p className="mt-2 text-md text-gray-500 max-w-sm mx-auto">
                Subjects you create sessions for will appear here.
              </p>
            </div>
          ) : !selectedSubject ? (
            // --- SUBJECTS LIST VIEW ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => (
                <div
                  key={sub.subject}
                  onClick={() => setSelectedSubject(sub)}
                  className="group bg-white flex flex-col justify-between shadow-sm border border-gray-100 rounded-2xl p-6 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decorative top border */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
                      {sub.subject}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                        Sessions
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {sub.totalSessions}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                        Students
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {sub.totalStudents}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end text-sm">
                    <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                      View Sessions{" "}
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // --- SPECIFIC SUBJECT DETAIL VIEW ---
            <div className="animation-fade-in">
              <button
                onClick={() => setSelectedSubject(null)}
                className="mb-6 inline-flex items-center text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hover:border-indigo-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Subject List
              </button>

              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
                  <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 mb-3">
                      Subject Overview
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
                      {selectedSubject.subject} Analytics
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Total Attended
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {selectedSubject.sessions.map((s) => (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {formatDate(s.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                              {s.attendedCount} /{" "}
                              {selectedSubject.totalStudents} Students
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {s.isActive ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 animate-pulse">
                                LIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                Completed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() =>
                                setExpandedSession(
                                  expandedSession === s.id ? null : s.id,
                                )
                              }
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                            >
                              {expandedSession === s.id
                                ? "Close Class List"
                                : "View Class List"}
                              {expandedSession === s.id ? (
                                <ChevronUp className="w-4 h-4 ml-2" />
                              ) : (
                                <ChevronDown className="w-4 h-4 ml-2" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Attendee Details */}
                        {expandedSession === s.id && (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-6 py-6 bg-gray-50/50 border-t border-gray-100"
                            >
                              {allStudents.length === 0 ? (
                                <div className="text-center py-4">
                                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500 font-medium">
                                    No students enrolled in the system.
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allStudents.map((student) => {
                                      const record = s.attendees.find(
                                        (a) => a.id === student.id,
                                      );
                                      const isPresent = !!record;

                                      return (
                                        <div
                                          key={student.id}
                                          className="flex items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100"
                                        >
                                          <span
                                            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg mr-3 ${isPresent ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                                          >
                                            {student.name
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                              {student.name}
                                            </p>
                                            <p className="text-xs font-medium text-gray-500 truncate">
                                              {student.email}
                                            </p>
                                            {isPresent && record.scannedAt && (
                                              <p className="text-[10px] text-gray-400 mt-0.5">
                                                Scanned:{" "}
                                                {formatTimeOnly(
                                                  record.scannedAt,
                                                )}
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right ml-2 group relative">
                                            <button
                                              onClick={() =>
                                                handleOverride(
                                                  s.id,
                                                  student.id,
                                                  isPresent
                                                    ? "PRESENT"
                                                    : "ABSENT",
                                                )
                                              }
                                              className={`flex items-center px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors ${
                                                isPresent
                                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                                  : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                              }`}
                                              title={`Click to mark as ${isPresent ? "Absent" : "Present"}`}
                                            >
                                              {isPresent ? (
                                                <>
                                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />{" "}
                                                  Present
                                                </>
                                              ) : (
                                                <>
                                                  <XCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                                  Absent
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
