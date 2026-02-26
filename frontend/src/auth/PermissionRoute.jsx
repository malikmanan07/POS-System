import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PermissionRoute({ permission, children }) {
  const { user, hasPermission, permissions } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  if (permission && !hasPermission(permission)) {
    // If user has NO permissions at all, or doesn't have the specific one
    // Avoid redirecting to a page that also needs a permission they don't have
    if (location.pathname === "/app/pos") {
      // We are already on POS and still don't have access? 
      // This prevents the loop.
      return (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-white p-5 text-center">
          <i className="bi bi-shield-lock fs-1 mb-3 text-danger"></i>
          <h3>Access Denied</h3>
          <p className="text-muted">You do not have permission to access this module ({permission}).</p>
          <div className="small mt-2">Your current roles: {user.roles?.join(', ') || 'None'}</div>
        </div>
      );
    }

    // Default fallback to POS, but ONLY if they have that permission
    if (hasPermission("create_sale")) {
      return <Navigate to="/app/pos" replace />;
    }

    // If they have nothing, show the access denied screen
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-white p-5 text-center">
        <i className="bi bi-shield-lock fs-1 mb-3 text-danger"></i>
        <h3>Access Denied</h3>
        <p className="text-muted">Your account does not have any active permissions. Please contact an administrator.</p>
      </div>
    );
  }

  return children;
}