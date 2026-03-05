import { api } from "./client";

export const fetchDashboardStats = (token) => {
    return api.get("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
    });
};
