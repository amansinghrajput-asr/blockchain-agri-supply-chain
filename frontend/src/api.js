import axios from "axios";

const api = axios.create({
  baseURL: "",
  headers: { "Bypass-Tunnel-Reminder": "true" },
});

// Attach token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("agri_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──
export const register = (data) => api.post("/api/auth/register", data);
export const login = (data) => api.post("/api/auth/login", data);
export const getMe = () => api.get("/api/auth/me");

// ── Batch CRUD ──
export const createBatch = (data) => api.post("/api/batches", data);
export const listBatches = () => api.get("/api/batches");
export const getBatch = (id) => api.get(`/api/batches/${id}`);
export const updateBatchStatus = (id, status, description) =>
  api.patch(`/api/batches/${id}/status`, { status, description });
export const settle = (id) => api.post(`/api/batches/${id}/settle`);

// ── AI ──
export const assess = (form) =>
  api.post("/api/quality/assess", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Events ──
export const getBatchEvents = (id) => api.get(`/api/batches/${id}/events`);

export default api;
