import React from "react";
import {
  Clock,
  BookOpen,
  CalendarDays,
  TrendingUp,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

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

export const StudentHistory = ({
  subjects,
  selectedSubject,
  setSelectedSubject,
}) => {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-20 bg-white shadow-sm border border-gray-100 rounded-2xl">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="h-10 w-10 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No Subjects Found</h3>
        <p className="mt-2 text-md text-gray-500 max-w-sm mx-auto">
          You haven't been enrolled in any subjects or marked attendance yet.
        </p>
      </div>
    );
  }

  if (!selectedSubject) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subjects.map((sub) => {
          const percentage = parseFloat(sub.percentage) || 0;
          const circumference = 2 * Math.PI * 30;
          const strokeDashoffset =
            circumference - (percentage / 100) * circumference;

          let ringColor = "text-emerald-500";
          if (percentage < 75) ringColor = "text-red-500";
          else if (percentage < 85) ringColor = "text-yellow-500";

          return (
            <div
              key={sub.subject}
              onClick={() => setSelectedSubject(sub)}
              className="group bg-white flex flex-col justify-between shadow-sm border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-200 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center mb-0.5">
                    <BookOpen className="w-4 h-4 mr-2 text-indigo-500" />
                    {sub.subject}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium ml-6">
                    {sub.totalClasses} Total Classes
                  </p>
                </div>

                {/* Circular Progress (Scaled down) */}
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="26"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-slate-100"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="26"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className={`${ringColor} transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-slate-800">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center items-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
                    Attended
                  </p>
                  <p className="text-lg font-extrabold text-emerald-600 leading-tight">
                    {sub.attended}
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center items-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
                    Absent
                  </p>
                  <p className="text-lg font-extrabold text-red-600 leading-tight">
                    {sub.absent}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end text-sm mt-auto">
                <span className="text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center text-xs">
                  View Details{" "}
                  <ArrowLeft className="w-3.5 h-3.5 ml-1 rotate-180" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
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
                {parseFloat(selectedSubject.percentage || 0).toFixed(1)}%
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
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Recent Activity
          </h3>
        </div>

        {!selectedSubject.sessions || selectedSubject.sessions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 font-medium">
            No sessions recorded yet.
          </div>
        ) : (
          <div className="p-6 bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedSubject.sessions.map((record, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow hover:border-indigo-200 transition-all flex flex-col justify-between h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-gray-900">
                      {formatDate(record.date)}
                    </span>
                    {getStatusBadge(record.status)}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                      Session ID
                    </p>
                    <p className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                      {record.sessionId}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
