import { api } from "./client";

export const fetchProducts = (token) => {
    return api.get("/api/products?limit=all", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const createProduct = (data, token) => {
    return api.post("/api/products", data, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
    });
};

export const updateProduct = (id, data, token) => {
    return api.put(`/api/products/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
    });
};

export const deleteProduct = (id, token) => {
    return api.delete(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchCategoriesFlat = (token) => {
    return api.get("/api/categories?limit=all", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const fetchSuppliersList = (token) => {
    return api.get("/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const importProductsBulk = (products, token) => {
    return api.post("/api/products/bulk", { products }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

