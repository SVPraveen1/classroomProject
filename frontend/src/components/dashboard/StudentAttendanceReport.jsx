import React, { useState, useEffect, useCallback } from "react";
import { Users, Filter, Hash, Mail, X, Send, Loader2 } from "lucide-react";
import { sessionService } from "../../services/session.service";
import { emailService } from "../../services/email.service";

/* ────────── Email Modal ────────── */
const EmailModal = ({ student, onClose }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error', text }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setResult({ type: "error", text: "Subject and message are required." });
      return;
    }

    try {
      setSending(true);
      setResult(null);
      await emailService.sendEmailToStudent(student.id, subject, message);
      setResult({ type: "success", text: "Email sent successfully!" });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setResult({
        type: "error",
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to send email.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800">Send Email</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              To: <span className="font-semibold">{student.email}</span>
              {student.guardianEmail && (
                <span>
                  {" "}
                  · CC:{" "}
                  <span className="font-semibold">{student.guardianEmail}</span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Attendance Warning"
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Type your message here..."
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {result && (
            <div
              className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                result.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}
            >
              {result.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────── Main Component ────────── */
export const StudentAttendanceReport = () => {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ branches: [], subjects: [] });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [rollNoFilter, setRollNoFilter] = useState("");
  const [attendanceRange, setAttendanceRange] = useState("");
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailTarget, setEmailTarget] = useState(null); // student obj for modal

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await sessionService.getStudentReport({
        branchName: selectedBranch || undefined,
        subject: selectedSubject || undefined,
      });
      setStudents(res.students || []);
      setFilters(res.filters || { branches: [], subjects: [] });
      setTotalSessions(res.totalSessions || 0);
      setTotalStudents(res.totalStudents || 0);
    } catch (err) {
      console.error("Failed to fetch student report", err);
      setError("Failed to load student attendance report.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedSubject]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      // 1. Roll No / Search Filter
      if (rollNoFilter) {
        const searchStr = `${s.rollNo || ""} ${s.name || ""}`.toLowerCase();
        if (!searchStr.includes(rollNoFilter.toLowerCase())) return false;
      }

      // 2. Attendance Range Filter
      if (attendanceRange) {
        const pct = Number(s.percentage) || 0;
        if (attendanceRange === "< 50" && pct >= 50) return false;
        if (attendanceRange === "51-60" && (pct < 51 || pct > 60)) return false;
        if (attendanceRange === "61-75" && (pct < 61 || pct > 75)) return false;
        if (attendanceRange === "> 75" && pct <= 75) return false;
      }

      return true;
    });
  }, [students, rollNoFilter, attendanceRange]);

  const getPercentageColor = (pct) => {
    if (pct >= 75) return "text-emerald-700 bg-emerald-50 border-emerald-100";
    if (pct >= 50) return "text-yellow-700 bg-yellow-50 border-yellow-100";
    return "text-red-700 bg-red-50 border-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Stats + Filters Bar */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6">
        {/* Summary Stats */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100">
            <Users className="w-4 h-4" />
            <span className="text-sm font-bold">{totalStudents} Students</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-sm font-bold">{totalSessions} Sessions</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
            <Filter className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Filters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Branch Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all duration-200 appearance-none"
            >
              <option value="">All Branches</option>
              {filters.branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all duration-200 appearance-none"
            >
              <option value="">All Subjects</option>
              {filters.subjects.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Roll No Search */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">
              Roll No
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={rollNoFilter}
                onChange={(e) => setRollNoFilter(e.target.value)}
                className="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all duration-200"
              />
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Attendance Range Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">
              Attendance %
            </label>
            <select
              value={attendanceRange}
              onChange={(e) => setAttendanceRange(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all duration-200 appearance-none"
            >
              <option value="">All Ranges</option>
              <option value="< 50">&lt; 50%</option>
              <option value="51-60">51% - 60%</option>
              <option value="61-75">61% - 75%</option>
              <option value="> 75">&gt; 75%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 p-4 border-l-4 border-red-400 rounded-md">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              No students found for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Attendance %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Hash className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                          <span className="text-sm font-bold text-slate-800">
                            {s.rollNo || "—"}
                          </span>
                        </div>
                        {s.isLateRegistered && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                            Late Registered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-emerald-600">
                        {s.presentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-red-500">
                        {s.absentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getPercentageColor(s.percentage)}`}
                      >
                        {s.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setEmailTarget(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Send Mail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {emailTarget && (
        <EmailModal
          student={emailTarget}
          onClose={() => setEmailTarget(null)}
        />
      )}
    </div>
  );
};
