import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar() {
  const { hasPermission } = useAuth();

  return (
    <div className="sidebar glass p-3">

      {hasPermission("view_dashboard") && (
        <NavLink to="/app" className="nav-itemx" end>Dashboard</NavLink>
      )}

      {hasPermission("manage_products") && (
        <NavLink to="/app/products" className="nav-itemx">Products</NavLink>
      )}

      {hasPermission("manage_users") && (
        <>
          <NavLink to="/app/roles" className="nav-itemx">Roles</NavLink>
          <NavLink to="/app/users" className="nav-itemx">Users</NavLink>
          <NavLink to="/app/access" className="nav-itemx">Access</NavLink>
        </>
      )}

      {hasPermission("create_sale") && (
        <NavLink to="/app/pos" className="nav-itemx">POS</NavLink>
      )}

    </div>
  );
}