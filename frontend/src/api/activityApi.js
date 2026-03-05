import { api } from "./client";

export const fetchActivityModules = (token) => {
    return api.get("/api/activity/modules", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchActivityLogs = (params, token) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/activity?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const exportActivityLogs = (params, token) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/activity/export?${queryParams}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
    });
};

