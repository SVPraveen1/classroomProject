import React, { useState } from "react";
import {
  CalendarDays,
  BookOpen,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Users,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatDate, formatTimeOnly } from "../../utils/dateUtils";
import { sessionService } from "../../services/session.service";

export const TeacherSessionList = ({
  subjects,
  allStudents,
  selectedSubject,
  setSelectedSubject,
  handleOverride,
}) => {
  const [expandedSession, setExpandedSession] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isAscending, setIsAscending] = useState(false);

  const handleDownloadCsv = async () => {
    if (!selectedSubject) return;
    try {
      setIsExporting(true);
      const blob = await sessionService.exportCsv(selectedSubject.subject);

      // Create a link element, use it to download, then remove it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${selectedSubject.subject.replace(/\s+/g, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export attendance data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (subjects.length === 0) {
    return (
      <div className="text-center py-20 bg-white shadow-sm border border-gray-100 rounded-2xl">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="h-10 w-10 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No Subjects Found</h3>
        <p className="mt-2 text-md text-gray-500 max-w-sm mx-auto">
          Subjects you create sessions for will appear here.
        </p>
      </div>
    );
  }

  if (!selectedSubject) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subjects.map((sub) => (
          <div
            key={sub.subject}
            onClick={() => setSelectedSubject(sub)}
            className="group bg-white flex flex-col justify-between shadow-sm border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-200 relative overflow-hidden"
          >
            {/* Subtle top border on hover */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex items-center justify-between mb-4 mt-1">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-indigo-500" />
                {sub.subject}
              </h3>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center items-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
                  Sessions
                </p>
                <p className="text-lg font-extrabold text-slate-800 leading-tight">
                  {sub.totalSessions}
                </p>
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center items-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
                  Students
                </p>
                <p className="text-lg font-extrabold text-slate-800 leading-tight">
                  {sub.totalStudents}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end text-sm mt-auto">
              <span className="text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center text-xs">
                View Details{" "}
                <svg
                  className="w-3.5 h-3.5 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
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
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
              <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
                {selectedSubject.subject} Analytics
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Review past sessions, student attendance, and export data.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={isExporting}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm border transition-all ${
              isExporting
                ? "bg-indigo-100 text-indigo-500 border-indigo-200 cursor-wait"
                : "bg-indigo-600 text-white border-transparent hover:bg-indigo-700 active:scale-[0.98]"
            }`}
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500"
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
                Generating CSV...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download CSV
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => setIsAscending(!isAscending)}
                  className="flex items-center text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors active:scale-95 group"
                >
                  Sort by Date & Time
                  {isAscending ? (
                    <ArrowUp className="w-3.5 h-3.5 ml-1.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  )}
                </button>
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
            {[...selectedSubject.sessions]
              .sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return isAscending ? dateA - dateB : dateB - dateA;
              })
              .map((s) => (
                <React.Fragment key={s.id}>
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatDate(s.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        {s.attendedCount} / {selectedSubject.totalStudents}{" "}
                        Students
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
                                      {(student.rollNo || student.name)
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-gray-900 truncate">
                                        {student.rollNo || student.name}
                                      </p>
                                      <p className="text-xs font-medium text-gray-500 truncate">
                                        {student.email}
                                      </p>
                                      {isPresent && record.scannedAt && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                          Scanned:{" "}
                                          {formatTimeOnly(record.scannedAt)}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right ml-2 group relative">
                                      <button
                                        onClick={() =>
                                          handleOverride(
                                            s.id,
                                            student.id,
                                            isPresent ? "PRESENT" : "ABSENT",
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
  );
};
