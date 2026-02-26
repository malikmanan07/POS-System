import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar() {
  const { hasPermission } = useAuth();

  return (
    <div className="sidebar glass p-3">

      {hasPermission("view_dashboard") && (
        <NavLink to="/app" className="nav-itemx" end>
          <i className="bi bi-speedometer2"></i> Dashboard
        </NavLink>
      )}

      {hasPermission("manage_products") && (
        <>
          <NavLink to="/app/products" className="nav-itemx">
            <i className="bi bi-box-seam"></i> Products
          </NavLink>
          <NavLink to="/app/categories" className="nav-itemx">
            <i className="bi bi-tags"></i> Categories
          </NavLink>
        </>
      )}

      {hasPermission("manage_customers") && (
        <NavLink to="/app/customers" className="nav-itemx">
          <i className="bi bi-person-badge"></i> Customers
        </NavLink>
      )}

      {hasPermission("view_sales") && (
        <NavLink to="/app/sales" className="nav-itemx">
          <i className="bi bi-receipt"></i> Sales
        </NavLink>
      )}

      {hasPermission("manage_users") && (
        <>
          <NavLink to="/app/roles" className="nav-itemx">
            <i className="bi bi-shield-lock"></i> Roles
          </NavLink>
          <NavLink to="/app/users" className="nav-itemx">
            <i className="bi bi-people"></i> Users
          </NavLink>
          <NavLink to="/app/access" className="nav-itemx">
            <i className="bi bi-key"></i> Access
          </NavLink>
        </>
      )}

      {hasPermission("create_sale") && (
        <NavLink to="/app/pos" className="nav-itemx">
          <i className="bi bi-cart3"></i> POS
        </NavLink>
      )}

      {hasPermission("system_settings") && (
        <NavLink to="/app/settings" className="nav-itemx">
          <i className="bi bi-gear"></i> Settings
        </NavLink>
      )}

    </div>

  );
}