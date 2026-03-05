import { api } from "./client";

export const fetchDiscountsList = (token) => {
    return api.get("/api/discounts", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const createDiscount = (data, token) => {
    return api.post("/api/discounts", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateDiscount = (id, data, token) => {
    return api.put(`/api/discounts/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const deleteDiscount = (id, token) => {
    return api.delete(`/api/discounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
