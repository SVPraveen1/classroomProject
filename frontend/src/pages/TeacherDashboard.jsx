import React, { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { TeacherActiveSession } from "../components/dashboard/TeacherActiveSession";
import { TeacherSessionList } from "../components/dashboard/TeacherSessionList";

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("session"); // 'session' or 'history'

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Teacher Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {session && (
            <button
              onClick={endSession}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              End Active Session
            </button>
          )}
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
    </div>
  );
};

export default TeacherDashboard;
