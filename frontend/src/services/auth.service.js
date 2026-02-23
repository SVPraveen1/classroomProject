import api from "../api";

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (name, email, password, role) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
    });
    return response.data;
  },

  bulkRegister: async (csvDataList) => {
    const response = await api.post("/auth/bulk-register", csvDataList);
    return response.data;
  },
};
