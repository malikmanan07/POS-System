import { api } from "./client";

export const fetchUsersList = (token) => {
    return api.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const createUser = (data, token) => {
    return api.post("/api/users", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateUser = (id, data, token) => {
    return api.put(`/api/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const deleteUser = (id, token) => {
    return api.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
