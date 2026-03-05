import { Card, Badge, Table } from "react-bootstrap";
import Skeleton from "../Skeleton";

export default function CustomerBreakdownTable({ data, currencySymbol, loading }) {
    return (
        <Card className="glass shadow-soft border-0 h-100 overflow-hidden">
            <div className="p-3 bg-black d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-white mb-0">Customer Breakdown</h6>
                <Badge bg="info">Top Spenders</Badge>
            </div>
            <div className="table-responsive">
                <Table hover variant="dark" className="mb-0">
                    <thead>
                        <tr>
                            <th className="ps-3">Customer Name</th>
                            <th>Orders</th>
                            <th className="pe-3 text-end">Total Spent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && data.customerStats.length === 0 ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="ps-3"><Skeleton width="70%" /></td>
                                    <td><Skeleton width="40%" /></td>
                                    <td className="pe-3 text-end"><Skeleton width="60%" className="ms-auto" /></td>
                                </tr>
                            ))
                        ) : (
                            <>
                                {data.customerStats.map(c => (
                                    <tr key={c.id}>
                                        <td className="ps-3 fw-bold">{c.name}</td>
                                        <td>{c.totalOrders}</td>
                                        <td className="pe-3 text-end text-info fw-bold">
                                            {currencySymbol}{parseFloat(c.totalSpent).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {data.customerStats.length === 0 && (
                                    <tr><td colSpan="3" className="text-center py-4 text-muted">No data available</td></tr>
                                )}
                            </>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );
}
