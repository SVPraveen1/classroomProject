import api from "../api";

export const leaveService = {
  // Student: Request leave for a specific past session
  requestLeaveForSession: async (sessionId, reason) => {
    const response = await api.post("/leave/request/session", {
      sessionId,
      reason,
    });
    return response.data;
  },

  // Student: Request leave for a future date
  requestLeaveForFutureDate: async (subject, leaveDate, reason) => {
    const response = await api.post("/leave/request/future", {
      subject,
      leaveDate,
      reason,
    });
    return response.data;
  },

  // Student: Get my leave requests
  getMyLeaveRequests: async () => {
    const response = await api.get("/leave/my-requests");
    return response.data;
  },

  // Student: Cancel a pending request
  cancelLeaveRequest: async (requestId) => {
    const response = await api.delete(`/leave/${requestId}`);
    return response.data;
  },

  // Teacher: Get all pending leave requests for my subjects
  getTeacherPendingRequests: async () => {
    const response = await api.get("/leave/pending");
    return response.data;
  },

  // Teacher: Get leave requests for a specific session
  getSessionLeaveRequests: async (sessionId) => {
    const response = await api.get(`/leave/session/${sessionId}`);
    return response.data;
  },

  // Teacher: Review (approve/reject) a leave request
  reviewLeaveRequest: async (requestId, status, reviewComment) => {
    const response = await api.post(`/leave/${requestId}/review`, {
      status, // 'APPROVED' or 'REJECTED'
      reviewComment,
    });
    return response.data;
  },
};
