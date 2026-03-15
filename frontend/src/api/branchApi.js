import { api } from "./client";

export const fetchBranchesList = (page = 1, limit = 10) => {
    return api.get(`/api/branches?page=${page}&limit=${limit}`);
};

export const createBranch = (data) => {
    return api.post("/api/branches", data);
};

export const updateBranch = (id, data) => {
    return api.put(`/api/branches/${id}`, data);
};

export const assignUserToBranch = (data) => {
    return api.post("/api/branches/assign", data);
};

export const removeUserFromBranch = (userId, businessId) => {
    return api.delete(`/api/branches/assign/${userId}/${businessId}`);
};

export const fetchUserAssignments = (userId) => {
    return api.get(`/api/branches/user/${userId}`);
};
