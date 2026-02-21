import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../api";
import {
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  CalendarDays,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";

const StudentDashboard = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, scanning, geolocating, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [distance, setDistance] = useState(null);
  const [activeTab, setActiveTab] = useState("scan"); // 'scan' or 'history'

  // History state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    if (status === "scanning") {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          qrbox: { width: 250, height: 250 },
          fps: 5,
        },
        false,
      );

      scanner.render(
        (data) => {
          scanner.clear();
          setScanResult(data);
          processAttendance(data);
        },
        (err) => {
          /* Ignore frequent scan errors */
        },
      );

      return () => {
        scanner
          .clear()
          .catch((error) => console.error("Failed to clear scanner", error));
      };
    }
  }, [status]);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/attendance/history");
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const processAttendance = (sessionId) => {
    setStatus("geolocating");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.post("/attendance/mark", {
            sessionId,
            latitude,
            longitude,
          });
          setDistance(res.data.distanceMeters);
          setStatus("success");
          fetchHistory(); // Refresh history after marking
        } catch (err) {
          setStatus("error");
          setErrorMessage(
            err.response?.data?.error ||
              err.response?.data?.message ||
              "Failed to mark attendance.",
          );
          if (err.response?.data?.distance) {
            setDistance(err.response.data.distance);
          }
        }
      },
      (geoError) => {
        setStatus("error");
        setErrorMessage(
          "Location access denied. We need your location to verify you are in class.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const resetState = () => {
    setScanResult(null);
    setStatus("idle");
    setErrorMessage("");
    setDistance(null);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "PRESENT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Present
          </span>
        );
      case "ABSENT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Absent
          </span>
        );
      case "ONGOING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
            <Clock className="w-3 h-3 mr-1" /> Ongoing
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Student Portal
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Mark your attendance by scanning the teacher's QR code.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("scan");
              setSelectedSubject(null);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "scan" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <Camera className="inline w-4 h-4 mr-1 -mt-0.5" /> Mark Attendance
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setSelectedSubject(null);
              fetchHistory();
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "history" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <CalendarDays className="inline w-4 h-4 mr-1 -mt-0.5" /> Subject
            Records
          </button>
        </nav>
      </div>

      {/* ───────── SCAN TAB ───────── */}
      {activeTab === "scan" && (
        <div className="bg-white shadow rounded-lg p-6 max-w-lg mx-auto">
          {status === "idle" && (
            <div className="text-center py-10">
              <Camera className="mx-auto h-16 w-16 text-indigo-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Ready to Scan
              </h3>
              <p className="text-gray-500 text-sm mt-2 mb-6 px-4">
                Ensure you are physically inside the classroom before scanning.
                Location permissions are required.
              </p>
              <button
                onClick={() => setStatus("scanning")}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Open Camera Scanner
              </button>
            </div>
          )}

          {status === "scanning" && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium mb-4 animate-pulse text-indigo-600">
                Scanning for QR Code...
              </h3>
              <div
                id="reader"
                className="w-full overflow-hidden rounded-lg shadow-inner bg-gray-100"
              ></div>
              <button
                onClick={resetState}
                className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cancel Scan
              </button>
            </div>
          )}

          {status === "geolocating" && (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-16 w-16 text-blue-500 animate-bounce mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Verifying Location...
              </h3>
              <p className="text-gray-500 text-sm mt-2">
                Checking your GPS coordinates against the classroom.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-10 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle2 className="mx-auto h-20 w-20 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-green-800">
                Attendance Marked!
              </h3>
              <p className="text-green-600 font-medium mt-2">
                Session ID: {scanResult?.substring(0, 8)}...
              </p>
              <p className="text-xs text-green-500 mt-4 opacity-75">
                Verified {Math.round(distance || 0)} meters from teacher
              </p>
              <button
                onClick={() => {
                  resetState();
                  setActiveTab("history");
                }}
                className="mt-8 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow"
              >
                View subject records
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-10 bg-red-50 rounded-xl border border-red-200">
              <XCircle className="mx-auto h-20 w-20 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-800">
                Verification Failed
              </h3>
              <p className="text-red-700 font-medium mt-2 px-4">
                {errorMessage}
              </p>
              {distance && distance > 200 && (
                <p className="text-sm text-red-500 mt-4 bg-red-100 p-2 rounded inline-block">
                  Calculated Distance: {Math.round(distance)}m (Limit: 200m)
                </p>
              )}
              <div className="mt-8">
                <button
                  onClick={resetState}
                  className="px-6 py-2 bg-white border border-red-300 hover:bg-red-50 text-red-700 rounded-md shadow-sm transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────── SUBJECT RECORDS / HISTORY TAB ───────── */}
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
                You haven't been enrolled in any subjects or marked attendance
                yet.
              </p>
            </div>
          ) : !selectedSubject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => {
                const percentage = parseFloat(sub.percentage) || 0;
                const circumference = 2 * Math.PI * 36;
                const strokeDashoffset =
                  circumference - (percentage / 100) * circumference;

                let ringColor = "text-emerald-500";
                if (percentage < 75) ringColor = "text-red-500";
                else if (percentage < 85) ringColor = "text-yellow-500";

                return (
                  <div
                    key={sub.subject}
                    onClick={() => setSelectedSubject(sub)}
                    className="group bg-white flex flex-col justify-between shadow-sm border border-gray-100 rounded-2xl p-6 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight flex items-center mb-1">
                          <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
                          {sub.subject}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium ml-7">
                          {sub.totalClasses} Total Classes
                        </p>
                      </div>

                      {/* Circular Progress */}
                      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-gray-100"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={`${ringColor} transition-all duration-1000 ease-out`}
                          />
                        </svg>
                        <span className="absolute text-sm font-bold text-gray-800">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 mt-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                          Attended
                        </p>
                        <p className="text-lg font-bold text-emerald-600">
                          {sub.attended}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                          Absent
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          {sub.absent}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end text-sm">
                      <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                        View Details{" "}
                        <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animation-fade-in">
              <button
                onClick={() => setSelectedSubject(null)}
                className="mb-6 inline-flex items-center text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hover:border-indigo-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Subjects
              </button>

              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
                  <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 mb-3">
                      Subject Overview
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                      {selectedSubject.subject}
                    </h3>
                    <div className="flex items-center text-sm font-medium text-gray-500">
                      <span>Total Classes: {selectedSubject.totalClasses}</span>
                      <span className="mx-2">•</span>
                      <span className="text-emerald-600">
                        Attended: {selectedSubject.attended}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="text-red-500">
                        Absent: {selectedSubject.absent}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 min-w-[200px]">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">
                      Current Attendance
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-gray-900">
                        {parseFloat(selectedSubject.percentage || 0).toFixed(1)}
                        %
                      </span>
                      {selectedSubject.percentage >= 75 ? (
                        <span className="text-emerald-500 flex items-center text-sm font-bold mb-1">
                          <TrendingUp className="w-4 h-4 mr-1" /> Safe
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center text-sm font-bold mb-1">
                          <TrendingUp className="w-4 h-4 mr-1 rotate-180" /> Low
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${selectedSubject.percentage >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{
                          width: `${Math.min(100, selectedSubject.percentage)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase mt-2 text-right">
                      75% Required
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Recent
                    Activity
                  </h3>
                </div>
                <ul className="divide-y divide-gray-50">
                  {!selectedSubject.sessions ||
                  selectedSubject.sessions.length === 0 ? (
                    <li className="px-6 py-12 text-center text-gray-500 font-medium">
                      No sessions recorded yet.
                    </li>
                  ) : (
                    selectedSubject.sessions.map((record, idx) => (
                      <li
                        key={idx}
                        className="px-6 py-4 hover:bg-gray-50/80 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {formatDate(record.date)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 font-medium">
                            Session ID: {record.sessionId.substring(0, 8)}...
                          </p>
                        </div>
                        <div>{getStatusBadge(record.status)}</div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
