import React, { useState, useEffect, useCallback } from "react";
import { Users, Filter, Hash } from "lucide-react";
import { sessionService } from "../../services/session.service";

export const StudentAttendanceReport = () => {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ branches: [], subjects: [] });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Subject Filter (grouped sessions) */}
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
        ) : students.length === 0 ? (
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Hash className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                        <span className="text-sm font-bold text-slate-800">
                          {s.rollNo || "—"}
                        </span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
