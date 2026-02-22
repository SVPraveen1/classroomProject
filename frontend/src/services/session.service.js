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
};
