import { Row, Col } from "react-bootstrap";
import StatCard from "../StatCard";

export default function DashboardStats({
    showRevenueStats,
    showInventoryStats,
    showCustomerStats,
    data,
    currencySymbol,
    isCashier,
    loading
}) {
    return (
        <Row className="g-3 mb-4">
            {showInventoryStats && (
                <Col md={6} xl={3}>
                    <StatCard
                        title="Products"
                        value={data.kpis.totalProducts}
                        icon="bi-box-seam"
                        hint="Total registered items"
                        loading={loading}
                    />
                </Col>
            )}

            {showRevenueStats && (
                <Col md={6} xl={3}>
                    <StatCard
                        title="Sales Today"
                        value={`${currencySymbol}${parseFloat(data.kpis.todayRevenue).toFixed(2)}`}
                        icon="bi-graph-up-arrow"
                        hint="Real-time revenue"
                        color="#22c55e"
                        loading={loading}
                    />
                </Col>
            )}

            {showInventoryStats && (
                <Col md={6} xl={3}>
                    <StatCard
                        title="Low Stock"
                        value={data.kpis.lowStock}
                        icon="bi-exclamation-triangle"
                        hint="SKUs needing refill"
                        color="#ef4444"
                        loading={loading}
                    />
                </Col>
            )}

            {showCustomerStats && (
                <Col md={6} xl={3}>
                    <StatCard
                        title="Customers"
                        value={data.kpis.totalCustomers}
                        icon="bi-people"
                        hint={isCashier ? "Add & search customers" : "Registered clients"}
                        color="#06b6d4"
                        loading={loading}
                    />
                </Col>
            )}
        </Row>
    );
}
