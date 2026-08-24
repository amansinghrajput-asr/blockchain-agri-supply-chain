import axios from "axios";
import {
  mockRegister,
  mockLogin,
  mockGetMe,
  mockListBatches,
  mockGetBatch,
  mockCreateBatch,
  mockGetBatchEvents,
  mockUpdateBatchStatus,
  mockSettle,
  mockAssess,
} from "./mockBackend";

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

// ── Detect if we are on GitHub Pages (no backend available) ──
let _isStatic = null;

async function isStaticHost() {
  if (_isStatic !== null) return _isStatic;
  try {
    const res = await axios.get("/health", { timeout: 3000 });
    _isStatic = !(res.data && res.data.ok);
  } catch {
    _isStatic = true;
  }
  return _isStatic;
}

// Helper that tries real API first, falls back to mock
async function withFallback(realCall, mockCall) {
  if (await isStaticHost()) {
    return mockCall();
  }
  try {
    return await realCall();
  } catch (e) {
    // If network error (backend down), fall back to mock
    if (!e.response) {
      _isStatic = true;
      return mockCall();
    }
    throw e;
  }
}

// ── Auth ──
export const register = (data) =>
  withFallback(
    () => api.post("/api/auth/register", data),
    () => mockRegister(data)
  );

export const login = (data) =>
  withFallback(
    () => api.post("/api/auth/login", data),
    () => mockLogin(data)
  );

export const getMe = () =>
  withFallback(
    () => api.get("/api/auth/me"),
    () => mockGetMe()
  );

// ── Batch CRUD ──
export const createBatch = (data) =>
  withFallback(
    () => api.post("/api/batches", data),
    () => mockCreateBatch(data)
  );

export const listBatches = () =>
  withFallback(
    () => api.get("/api/batches"),
    () => mockListBatches()
  );

export const getBatch = (id) =>
  withFallback(
    () => api.get(`/api/batches/${id}`),
    () => mockGetBatch(id)
  );

export const updateBatchStatus = (id, status, description) =>
  withFallback(
    () => api.patch(`/api/batches/${id}/status`, { status, description }),
    () => mockUpdateBatchStatus(id, status, description)
  );

export const settle = (id) =>
  withFallback(
    () => api.post(`/api/batches/${id}/settle`),
    () => mockSettle(id)
  );

// ── AI ──
export const assess = (form) =>
  withFallback(
    () =>
      api.post("/api/quality/assess", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    () => mockAssess(form)
  );

// ── Events ──
export const getBatchEvents = (id) =>
  withFallback(
    () => api.get(`/api/batches/${id}/events`),
    () => mockGetBatchEvents(id)
  );

export default api;
