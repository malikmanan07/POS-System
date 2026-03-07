import { api } from "./client";

export const fetchSettingsList = (token) => {
    return api.get("/api/settings", {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const saveSettingsSection = (section, data, token) => {
    // If it's business settings with a file, we need a separate handler or logic
    if (section === "business" && data instanceof FormData) {
        return api.post(`/api/settings/business`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data"
            }
        });
    }
    return api.post(`/api/settings/${section}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateSetting = (key, value, token) => {
    return api.put(`/api/settings/${key}`, value, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

