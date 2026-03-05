import { api } from "./client";

export const fetchCategoriesAll = (token) => {
    return api.get("/api/categories?limit=all", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const createCategory = (data, token) => {
    return api.post("/api/categories", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateCategory = (id, data, token) => {
    return api.put(`/api/categories/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const deleteCategory = (id, token) => {
    return api.delete(`/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
