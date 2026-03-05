import { api } from "./client";

// Customers
export const fetchCustomersList = (token) => {
    return api.get("/api/customers?limit=all", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const createCustomer = (data, token) => {
    return api.post("/api/customers", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateCustomer = (id, data, token) => {
    return api.put(`/api/customers/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const deleteCustomer = (id, token) => {
    return api.delete(`/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchCustomerHistory = (id, token) => {
    return api.get(`/api/customers/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Suppliers
export const fetchSuppliersList = (token) => {
    return api.get("/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const createSupplier = (data, token) => {
    return api.post("/api/suppliers", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateSupplier = (id, data, token) => {
    return api.put(`/api/suppliers/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const deleteSupplier = (id, token) => {
    return api.delete(`/api/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchSupplierProducts = (id, token) => {
    return api.get(`/api/suppliers/${id}/products`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
