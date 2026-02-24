import api from "../api";

export const emailService = {
  sendEmailToStudent: async (studentId, subject, message) => {
    const response = await api.post("/email/send", {
      studentId,
      subject,
      message,
    });
    return response.data;
  },
};
