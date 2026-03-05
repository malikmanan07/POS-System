import { api } from "./client";

export const fetchAnalyticsReport = (params, token) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/reports/analytics?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const exportSalesReportCsv = (params, token) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/reports/export-csv?${queryParams}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
    });
};
