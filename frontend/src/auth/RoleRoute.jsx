import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RoleRoute({ allow = [], children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (allow.length && !allow.includes(user.role)) {
    // if cashier tries admin page -> send to POS
    return <Navigate to="/pos" replace />;
  }
  return children;
}