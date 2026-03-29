import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const login = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const predict = async (formData) => {
  const response = await api.post("/predict", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getReports = async () => {
  const response = await api.get("/reports");
  return response.data;
};

export const getReportById = async (reportId) => {
  const response = await api.get(`/reports/${reportId}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get("/stats");
  return response.data;
};

export default api;
