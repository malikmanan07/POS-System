import { createContext, useContext, useEffect, useState } from "react";
import { loginUser } from "../api/authApi";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize state directly from localStorage to prevent logout on refresh
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [permissions, setPermissions] = useState(() => {
    const p = localStorage.getItem("permissions");
    return p ? JSON.parse(p) : [];
  });
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem("token");
    if (t) {
      api.defaults.headers.common.Authorization = `Bearer ${t}`;
    }
    return t;
  });

  const login = async (email, password) => {
    const res = await loginUser(email, password);

    const { token: t, user: u, permissions: perms } = res.data;

    setToken(t);
    setUser(u);
    setPermissions(perms);

    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("permissions", JSON.stringify(perms));

    api.defaults.headers.common.Authorization = `Bearer ${t}`;

    return u;
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    setToken(null);
    localStorage.clear();
    delete api.defaults.headers.common.Authorization;
  };

  const hasPermission = (perm) => permissions.includes(perm);

  return (
    <AuthContext.Provider
      value={{ user, token, permissions, login, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);