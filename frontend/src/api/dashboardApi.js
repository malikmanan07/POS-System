import { api } from "./client";

export const fetchDashboardStats = (token, global = false) => {
    return api.get(`/api/dashboard/stats?global=${global}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
