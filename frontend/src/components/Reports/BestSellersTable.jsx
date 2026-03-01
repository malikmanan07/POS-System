import { Card, Badge, Table } from "react-bootstrap";

export default function BestSellersTable({ data, currencySymbol }) {
    return (
        <Card className="glass shadow-soft border-0 h-100 overflow-hidden">
            <div className="p-3 bg-black d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-white mb-0">Best Selling Products</h6>
                <Badge bg="success">Top 10</Badge>
            </div>
            <div className="table-responsive">
                <Table hover variant="dark" className="mb-0">
                    <thead>
                        <tr>
                            <th className="ps-3">Product Name</th>
                            <th>Qty Sold</th>
                            <th className="pe-3 text-end">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.topProducts.map(p => (
                            <tr key={p.id}>
                                <td className="ps-3 fw-bold">{p.name}</td>
                                <td>{p.qtySold}</td>
                                <td className="pe-3 text-end text-success fw-bold">
                                    {currencySymbol}{parseFloat(p.revenue).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {data.topProducts.length === 0 && (
                            <tr><td colSpan="3" className="text-center py-4 text-muted">No data available</td></tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );
}
