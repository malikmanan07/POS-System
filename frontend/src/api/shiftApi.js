import { api } from "./client";

export const fetchShiftsList = (page = 1, limit = 10, token) => {
    return api.get(`/api/shifts?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchActiveShift = (token) => {
    return api.get("/api/shifts/active", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchCurrentShift = (token) => {
    return api.get("/api/shifts/current", {
        headers: { Authorization: `Bearer ${token}` }
    });
};


export const startShift = (data, token) => {
    return api.post("/api/shifts/start", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const endShift = (data, token) => {
    return api.post("/api/shifts/end", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchShiftDetails = (id, token) => {
    return api.get(`/api/shifts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
