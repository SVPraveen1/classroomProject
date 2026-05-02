import api from "../api";

export const attendanceService = {
  markAttendance: async (qrToken, latitude, longitude, deviceFingerprint) => {
    const response = await api.post("/attendance/mark", {
      qrToken,
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
