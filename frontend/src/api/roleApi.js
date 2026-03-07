import { api } from "./client";

export const fetchRolesList = (token) => {
    return api.get("/api/roles", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchPermissionsAll = (token) => {
    return api.get("/api/roles/permissions", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchRolePermissions = (roleId, token) => {
    return api.get(`/api/roles/${roleId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateRolePermissions = (roleId, permissions, token) => {
    return api.put(`/api/roles/${roleId}/permissions`, { permissions }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const createRole = (data, token) => {
    return api.post("/api/roles", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateRole = (id, data, token) => {
    return api.put(`/api/roles/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const deleteRole = (id, token) => {
    return api.delete(`/api/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

