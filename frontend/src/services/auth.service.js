import api from "../api";

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  /**
   * Register a new user.
   * @param {Object} userData - Registration payload (role-specific fields included)
   */
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  bulkRegister: async (csvDataList) => {
    const response = await api.post("/auth/bulk-register", csvDataList);
    return response.data;
  },
};
