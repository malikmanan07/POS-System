import { api } from "./client";

export const loginUser = (email, password) => {
    return api.post("/api/auth/login", { email, password });
};

// No logout API call currently in the app, but we can add placeholders if needed.
