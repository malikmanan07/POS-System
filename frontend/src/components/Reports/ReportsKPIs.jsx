import { Row, Col } from "react-bootstrap";
import StatCard from "../StatCard";

export default function ReportsKPIs({ data, currencySymbol }) {
    return (
        <Row className="g-3 mb-4">
            <Col md={3}>
                <StatCard
                    title="Total Sales"
                    value={data.summary.totalSales}
                    icon="bi-receipt"
                    color="#6d5efc"
                />
            </Col>
            <Col md={3}>
                <StatCard
                    title="Total Revenue"
                    value={`${currencySymbol}${parseFloat(data.summary.totalRevenue).toLocaleString()}`}
                    icon="bi-currency-dollar"
                    color="#22c55e"
                />
            </Col>
            <Col md={3}>
                <StatCard
                    title="Total Customers"
                    value={data.summary.totalCustomers}
                    icon="bi-people"
                    color="#06b6d4"
                />
            </Col>
            <Col md={3}>
                <StatCard
                    title="Avg Order Value"
                    value={`${currencySymbol}${parseFloat(data.summary.avgOrderValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    icon="bi-calculator"
                    color="#f59e0b"
                />
            </Col>
        </Row>
    );
}
