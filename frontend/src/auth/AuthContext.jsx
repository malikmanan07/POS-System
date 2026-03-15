import { createContext, useContext, useEffect, useState } from "react";
import { loginUser } from "../api/authApi";
import { api } from "../api/client";
import { useQueryClient } from "@tanstack/react-query";

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

  const [branches, setBranches] = useState(() => {
    const b = localStorage.getItem("branches");
    return b ? JSON.parse(b) : [];
  });

  const [activeBranchId, setActiveBranchId] = useState(() => {
    const id = localStorage.getItem("activeBranchId");
    if (id) {
      api.defaults.headers.common["x-business-id"] = id;
    }
    return id ? parseInt(id) : null;
  });

  const login = async (email, password) => {
    const res = await loginUser(email, password);

    const { token: t, user: u, permissions: perms, branches: b } = res.data;

    const firstBranchId = b && b.length > 0 ? b[0].id : u.businessId;

    setToken(t);
    setUser(u);
    setPermissions(perms);
    setBranches(b || []);
    setActiveBranchId(firstBranchId);

    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("permissions", JSON.stringify(perms));
    localStorage.setItem("branches", JSON.stringify(b || []));
    localStorage.setItem("activeBranchId", firstBranchId);

    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    api.defaults.headers.common["x-business-id"] = firstBranchId;

    return u;
  };

  const queryClient = useQueryClient();
  const logout = () => {
    setUser(null);
    setPermissions([]);
    setToken(null);
    setBranches([]);
    setActiveBranchId(null);
    localStorage.clear();
    queryClient.clear();
    delete api.defaults.headers.common.Authorization;
    delete api.defaults.headers.common["x-business-id"];
  };

  const switchBranch = (id) => {
    setActiveBranchId(id);
    localStorage.setItem("activeBranchId", id);
    api.defaults.headers.common["x-business-id"] = id;
    queryClient.clear(); // Clear cache for new branch data
  };

  const hasPermission = (perm) => permissions.includes(perm);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        branches,
        activeBranchId,
        login,
        logout,
        hasPermission,
        switchBranch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);