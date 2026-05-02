import api from "../api";

export const sessionService = {
  startSession: async (latitude, longitude, subject) => {
    const response = await api.post("/session/start", {
      latitude,
      longitude,
      subject,
    });
    return response.data;
  },

  endSession: async (sessionId) => {
    const response = await api.post("/session/end", { sessionId });
    return response.data;
  },

  getActiveSession: async () => {
    const response = await api.get("/session/active");
    return response.data;
  },

  getQrToken: async (sessionId, { signal } = {}) => {
    const response = await api.get(`/session/${sessionId}/qr-token`, {
      signal,
    });
    return response.data;
  },

  getSessionAttendees: async (sessionId) => {
    const response = await api.get(`/session/${sessionId}/attendance`);
    return response.data;
  },

  getSessionHistory: async () => {
    const response = await api.get("/session/history");
    return response.data;
  },

  overrideAttendance: async (sessionId, studentId, status) => {
    const response = await api.post("/session/override", {
      sessionId,
      studentId,
      status, // 'PRESENT' or 'ABSENT'
    });
    return response.data;
  },

  exportCsv: async (subjectName) => {
    // We need to request blob response type so that the browser can handle the raw file data
    const response = await api.get(
      `/session/export/${encodeURIComponent(subjectName)}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  getStudentReport: async ({ branchName, subject } = {}) => {
    const params = new URLSearchParams();
    if (branchName) params.append("branchName", branchName);
    if (subject) params.append("subject", subject);
    const response = await api.get(
      `/session/student-report?${params.toString()}`,
    );
    return response.data;
  },
};
