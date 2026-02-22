import React, { useState } from "react";
import { Camera, CalendarDays } from "lucide-react";
import { useStudentDashboard } from "../hooks/useStudentDashboard";
import { StudentScanner } from "../components/dashboard/StudentScanner";
import { StudentHistory } from "../components/dashboard/StudentHistory";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("scan"); // 'scan' or 'history'

  const {
    scanResult,
    status,
    setStatus,
    errorMessage,
    distance,
    subjects,
    selectedSubject,
    setSelectedSubject,
    resetState,
    fetchHistory,
  } = useStudentDashboard();

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
        <StudentScanner
          status={status}
          setStatus={setStatus}
          scanResult={scanResult}
          errorMessage={errorMessage}
          distance={distance}
          resetState={resetState}
          onSuccessViewRecords={() => {
            resetState();
            setActiveTab("history");
          }}
        />
      )}

      {/* ───────── SUBJECT RECORDS / HISTORY TAB ───────── */}
      {activeTab === "history" && (
        <StudentHistory
          subjects={subjects}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
