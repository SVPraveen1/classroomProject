import api from "../api";

export const attendanceService = {
  markAttendance: async (sessionId, latitude, longitude, deviceFingerprint) => {
    const response = await api.post("/attendance/mark", {
      sessionId,
      latitude,
      longitude,
      deviceFingerprint,
    });
    return response.data;
  },

  getAttendanceHistory: async () => {
    const response = await api.get("/attendance/history");
    return response.data;
  },
};
