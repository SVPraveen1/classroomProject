import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  X,
} from "lucide-react";
import { leaveService } from "../../services/leave.service";

const ReviewModal = ({ request, onClose, onSubmit }) => {
  const [status, setStatus] = useState("APPROVED");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(request.id, status, comment);
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/50">
          <h3 className="text-base font-bold text-slate-800">Review Request</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-bold text-slate-700 mb-1">
              {request.student.name} ({request.student.rollNo})
            </p>
            <p className="text-xs text-slate-500">
              {request.subject} •{" "}
              {request.session
                ? new Date(request.session.createdAt).toLocaleDateString()
                : new Date(request.leaveDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-600 mt-2">{request.reason}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Decision
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Add feedback for the student..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TeacherLeaveManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await leaveService.getTeacherPendingRequests();
      setRequests(res.requests || []);
    } catch (err) {
      setError("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, status, comment) => {
    try {
      await leaveService.reviewLeaveRequest(requestId, status, comment);
      setSuccess(`Leave request ${status.toLowerCase()}!`);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to review request");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-base font-bold text-slate-800">
            Pending Leave Requests
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {requests.length} request{requests.length !== 1 ? "s" : ""} waiting
            for review
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No pending leave requests
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {req.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          {req.student.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {req.student.rollNo} • {req.student.email}
                        </p>
                      </div>
                    </div>

                    <div className="ml-13 space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold text-slate-700">
                          {req.subject}
                        </span>{" "}
                        •{" "}
                        <span className="text-slate-600">
                          {req.session
                            ? new Date(
                                req.session.createdAt,
                              ).toLocaleDateString()
                            : new Date(req.leaveDate).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                        {req.reason}
                      </p>
                      <p className="text-xs text-slate-400">
                        Requested on{" "}
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
};
