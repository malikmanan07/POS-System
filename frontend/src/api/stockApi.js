import { api } from "./client";

export const fetchStockList = (token) => {
    return api.get("/api/stock", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const adjustStock = (data, token) => {
    return api.post("/api/stock/adjust", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchLowStock = (token) => {
    return api.get("/api/stock/low-stock", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchStockHistoryList = (params, token) => {
    const { page, limit, search } = params;
    return api.get(`/api/stock/history?page=${page}&limit=${limit}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
