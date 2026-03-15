import { Card } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Skeleton from "../Skeleton";
import ChartTooltip from "../ChartTooltip";

const COLORS = ['#6d5efc', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

export default function BranchComparisonChart({ data, currencySymbol, loading }) {
    if (loading) {
        return (
            <Card className="glass h-100 border-0 overflow-hidden shadow-soft">
                <Card.Body className="p-4 d-flex flex-column">
                    <Skeleton width="180px" height="24px" className="mb-4" />
                    <div className="mt-auto">
                        <Skeleton height="200px" />
                    </div>
                </Card.Body>
            </Card>
        );
    }

    const chartData = (data.branchComparison || []).map(b => ({
        name: b.name,
        revenue: parseFloat(b.revenue) || 0
    }));

    if (chartData.length === 0) return null;

    return (
        <Card className="glass h-100 border-0 overflow-hidden shadow-soft">
            <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h5 className="text-white mb-0">Branch Sales Comparison</h5>
                        <small className="text-muted">Revenue per branch</small>
                    </div>
                </div>

                <div className="chart-container" style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                            />
                            <Tooltip content={<ChartTooltip currencySymbol={currencySymbol} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card.Body>
        </Card>
    );
}
