import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PermissionRoute({ permission, children }) {
  const { user, hasPermission } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/pos" replace />;
  }

  return children;
}