import { api } from "./client";

<<<<<<< HEAD
export const fetchDashboardStats = (token) => {
    return api.get("/api/dashboard/stats", {
=======
export const fetchDashboardStats = (token, global = false) => {
    return api.get(`/api/dashboard/stats?global=${global}`, {
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
        headers: { Authorization: `Bearer ${token}` }
    });
};
