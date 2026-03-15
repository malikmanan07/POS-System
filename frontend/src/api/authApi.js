import { api } from "./client";

export const loginUser = (email, password) => {
    return api.post("/api/auth/login", { email, password });
};

export const signupUser = (data) => {
    return api.post("/api/auth/signup", data);
};

<<<<<<< HEAD
// No logout API call currently in the app, but we can add placeholders if needed.
=======
>>>>>>> 790210fce64f26269098e10d3d46cfa0442c96eb
