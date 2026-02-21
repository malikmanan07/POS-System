import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    const p = localStorage.getItem("permissions");

    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      setPermissions(p ? JSON.parse(p) : []);
      api.defaults.headers.common.Authorization = `Bearer ${t}`;
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });

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