import { api } from "./client";

export const devLogin = (email, password) => api.post("/api/dev/login", { email, password });
export const getDevDashboardStats = (params) => api.get("/api/dev/dashboard-stats", { params });
export const impersonateBusiness = (businessId) => api.post("/api/dev/impersonate", { businessId });
export const exportDevDashboardStats = (params) => api.get("/api/dev/export-stats", { params });
export const getBusinessDetails = (id, params) => api.get(`/api/dev/business/${id}`, { params });
export const toggleBusinessStatus = (id, isSuspended) => api.patch(`/api/dev/business/${id}/toggle-status`, { isSuspended });
