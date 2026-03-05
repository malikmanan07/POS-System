import { api } from "./client";

export const fetchSalesList = (params, token) => {
    const { page, limit, search, startDate, endDate } = params;
    return api.get(`/api/sales?page=${page}&limit=${limit}&search=${search}&startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchSaleDetails = (id, token) => {
    return api.get(`/api/sales/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const createSale = (saleData, token) => {
    return api.post("/api/sales", saleData, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const returnSale = (id, returnData, token) => {
    return api.post(`/api/sales/${id}/return`, returnData, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
