import React, { useState } from "react";
import { Camera, CalendarDays, FileText } from "lucide-react";
import { useStudentDashboard } from "../hooks/useStudentDashboard";
import { StudentScanner } from "../components/dashboard/StudentScanner";
import { StudentHistory } from "../components/dashboard/StudentHistory";
import { StudentLeaveRequest } from "../components/dashboard/StudentLeaveRequest";
import { DashboardLayout } from "../components/layout/DashboardLayout";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("scan"); // 'scan', 'history', or 'leave'

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
    scanImageFile,
    uploadError,
  } = useStudentDashboard();

  const navigation = [
    {
      id: "scan",
      name: "Mark Attendance",
      icon: Camera,
      active: activeTab === "scan",
      onClick: () => {
        setActiveTab("scan");
        setSelectedSubject(null);
      },
    },
    {
      id: "history",
      name: "Subject Records",
      icon: CalendarDays,
      active: activeTab === "history",
      onClick: () => {
        setActiveTab("history");
        setSelectedSubject(null);
        fetchHistory();
      },
    },
    {
      id: "leave",
      name: "Leave Requests",
      icon: FileText,
      active: activeTab === "leave",
      onClick: () => {
        setActiveTab("leave");
        setSelectedSubject(null);
      },
    },
  ];

  return (
    <DashboardLayout navigation={navigation}>
      <div className="mb-8 pl-1">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {activeTab === "scan" && "Class Scanner"}
          {activeTab === "history" && "Attendance Records"}
          {activeTab === "leave" && "Leave Requests"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {activeTab === "scan" &&
            "Scan your teacher's active session QR code to mark yourself present."}
          {activeTab === "history" &&
            "Review your past attendance history for all enrolled subjects."}
          {activeTab === "leave" &&
            "Request leave for past absences or future dates."}
        </p>
      </div>

      {/* ───────── SCAN TAB ───────── */}
      {activeTab === "scan" && (
        <div className="animation-fade-in">
          <StudentScanner
            status={status}
            setStatus={setStatus}
            scanResult={scanResult}
            errorMessage={errorMessage}
            distance={distance}
            resetState={resetState}
            scanImageFile={scanImageFile}
            uploadError={uploadError}
            onSuccessViewRecords={() => {
              resetState();
              setActiveTab("history");
              fetchHistory();
            }}
          />
        </div>
      )}

      {/* ───────── SUBJECT RECORDS / HISTORY TAB ───────── */}
      {activeTab === "history" && (
        <div className="animation-fade-in">
          <StudentHistory
            subjects={subjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
          />
        </div>
      )}

      {/* ───────── LEAVE REQUESTS TAB ───────── */}
      {activeTab === "leave" && (
        <div className="animation-fade-in">
          <StudentLeaveRequest />
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
