import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { leaveService } from "../../services/leave.service";
import { attendanceService } from "../../services/attendance.service";

export const StudentLeaveRequest = () => {
  const [activeTab, setActiveTab] = useState("past"); // 'past' or 'future'
  const [subjects, setSubjects] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Past session request form
  const [selectedSession, setSelectedSession] = useState("");
  const [pastReason, setPastReason] = useState("");

  // Future date request form
  const [futureSubject, setFutureSubject] = useState("");
  const [futureDate, setFutureDate] = useState("");
  const [futureReason, setFutureReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyRes, requestsRes] = await Promise.all([
        attendanceService.getAttendanceHistory(),
        leaveService.getMyLeaveRequests(),
      ]);
      setSubjects(historyRes.subjects || []);
      setMyRequests(requestsRes.requests || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handlePastSessionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await leaveService.requestLeaveForSession(selectedSession, pastReason);
      setSuccess("Leave request submitted successfully!");
      setSelectedSession("");
      setPastReason("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFutureDateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await leaveService.requestLeaveForFutureDate(
        futureSubject,
        futureDate,
        futureReason,
      );
      setSuccess("Leave request submitted successfully!");
      setFutureSubject("");
      setFutureDate("");
      setFutureReason("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (!confirm("Cancel this leave request?")) return;
    try {
      await leaveService.cancelLeaveRequest(requestId);
      setSuccess("Request cancelled");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel");
    }
  };

  const getAbsentSessions = () => {
    const absent = [];
    subjects.forEach((sub) => {
      sub.sessions
        .filter((s) => s.status === "ABSENT")
        .forEach((s) => {
          absent.push({
            sessionId: s.sessionId,
            subject: sub.subject,
            date: s.date,
            teacherName: s.teacherName,
          });
        });
    });
    return absent;
  };

  const getStatusBadge = (status) => {
    if (status === "PENDING")
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3 inline mr-1" />
          Pending
        </span>
      );
    if (status === "APPROVED")
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3 inline mr-1" />
          Approved
        </span>
      );
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        <XCircle className="w-3 h-3 inline mr-1" />
        Rejected
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Request Leave
        </h3>

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "past"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Past Sessions
          </button>
          <button
            onClick={() => setActiveTab("future")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "future"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Future Date
          </button>
        </div>

        {activeTab === "past" && (
          <form onSubmit={handlePastSessionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Select Session (where you were absent)
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a session</option>
                {getAbsentSessions().map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    {s.subject} - {new Date(s.date).toLocaleDateString()} (
                    {s.teacherName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Reason
              </label>
              <textarea
                value={pastReason}
                onChange={(e) => setPastReason(e.target.value)}
                required
                rows={3}
                placeholder="Explain why you were absent..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}

        {activeTab === "future" && (
          <form onSubmit={handleFutureDateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Subject
              </label>
              <select
                value={futureSubject}
                onChange={(e) => setFutureSubject(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.subject} value={s.subject}>
                    {s.subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Date
              </label>
              <input
                type="date"
                value={futureDate}
                onChange={(e) => setFutureDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Reason
              </label>
              <textarea
                value={futureReason}
                onChange={(e) => setFutureReason(e.target.value)}
                required
                rows={3}
                placeholder="Explain why you'll be absent..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-base font-bold text-slate-800">My Requests</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {myRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No leave requests yet
            </div>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800">
                        {req.subject}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-sm text-slate-600">
                      {req.session
                        ? new Date(req.session.createdAt).toLocaleDateString()
                        : new Date(req.leaveDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{req.reason}</p>
                    {req.reviewComment && (
                      <div className="mt-2 p-2 bg-amber-50 rounded text-xs">
                        <strong>Teacher: </strong>
                        {req.reviewComment}
                      </div>
                    )}
                  </div>
                  {req.status === "PENDING" && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
