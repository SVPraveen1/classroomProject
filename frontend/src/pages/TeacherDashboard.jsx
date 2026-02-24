import React, { useState } from "react";
import { MapPin, Clock, Upload, Users } from "lucide-react";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { TeacherActiveSession } from "../components/dashboard/TeacherActiveSession";
import { TeacherSessionList } from "../components/dashboard/TeacherSessionList";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { BulkUpload } from "../components/dashboard/BulkUpload";
import { StudentAttendanceReport } from "../components/dashboard/StudentAttendanceReport";

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("session"); // 'session', 'history', 'students', or 'bulk'

  const {
    session,
    attendees,
    loading,
    error,
    locationStatus,
    startSession,
    endSession,
    subjects,
    allStudents,
    selectedSubject,
    setSelectedSubject,
    handleOverride,
    fetchHistory,
  } = useTeacherDashboard();

  const navigation = [
    {
      id: "session",
      name: "Active Session",
      icon: MapPin,
      active: activeTab === "session",
      onClick: () => {
        setActiveTab("session");
        setSelectedSubject(null);
      },
    },
    {
      id: "history",
      name: "Subject Analytics",
      icon: Clock,
      active: activeTab === "history",
      onClick: () => {
        setActiveTab("history");
        setSelectedSubject(null);
        fetchHistory();
      },
    },
    {
      id: "bulk",
      name: "Bulk Registration",
      icon: Upload,
      active: activeTab === "bulk",
      onClick: () => {
        setActiveTab("bulk");
        setSelectedSubject(null);
      },
    },
    {
      id: "students",
      name: "Students",
      icon: Users,
      active: activeTab === "students",
      onClick: () => {
        setActiveTab("students");
        setSelectedSubject(null);
      },
    },
  ];

  return (
    <DashboardLayout navigation={navigation}>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {activeTab === "session" && "Active Session"}
            {activeTab === "history" && "Subject Analytics"}
            {activeTab === "bulk" && "Bulk Registration"}
            {activeTab === "students" && "Student Attendance Report"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {activeTab === "session" &&
              "Start or manage your current live attendance session."}
            {activeTab === "history" &&
              "Review past sessions, student attendance, and export data."}
            {activeTab === "bulk" &&
              "Upload CSV files to securely add bulk students or teachers."}
            {activeTab === "students" &&
              "View all students with attendance stats. Filter by branch or session."}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {session && (
            <button
              onClick={endSession}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              End Active Session
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 border-l-4 border-red-400 mb-6 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {locationStatus && (
        <div className="bg-blue-50 p-4 border-l-4 border-blue-400 mb-6 rounded-md">
          <p className="text-blue-700 animate-pulse">{locationStatus}</p>
        </div>
      )}

      {/* ───────── ACTIVE SESSION TAB ───────── */}
      {activeTab === "session" && (
        <div className="animation-fade-in">
          <TeacherActiveSession
            session={session}
            attendees={attendees}
            loading={loading}
            startSession={startSession}
          />
        </div>
      )}

      {/* ───────── SUBJECT ANALYTICS / HISTORY TAB ───────── */}
      {activeTab === "history" && (
        <div className="space-y-8 animation-fade-in">
          <TeacherSessionList
            subjects={subjects}
            allStudents={allStudents}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            handleOverride={handleOverride}
          />
        </div>
      )}

      {/* ───────── BULK UPLOAD TAB ───────── */}
      {activeTab === "bulk" && (
        <div className="animation-fade-in">
          <BulkUpload />
        </div>
      )}

      {/* ─── STUDENT ATTENDANCE REPORT TAB ─── */}
      {activeTab === "students" && (
        <div className="animation-fade-in">
          <StudentAttendanceReport />
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherDashboard;
