import { Card, Badge } from "react-bootstrap";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass p-2 px-3 border-0 shadow-lg" style={{ backgroundColor: "rgba(15, 23, 42, 0.95)" }}>
                <p className="fw-bold text-white mb-0 small">{data.name}</p>
                <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: payload[0].payload.fill || payload[0].color }}></div>
                    <span style={{ color: "var(--primary2)", fontWeight: "bold", fontSize: "13px" }}>
                        {data.sales} units sold
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function TopProductsChart({ data }) {
    return (
        <Card className="glass shadow-soft border-0 h-100">
            <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h6 className="fw-bold text-white mb-0">Top Products</h6>
                        <small className="text-muted">By total volume sold</small>
                    </div>
                    <Badge className="badge-soft">
                        <i className="bi bi-fire text-warning me-2"></i>
                        Hot Items
                    </Badge>
                </div>

                <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={data.topProducts}
                            margin={{ top: 10, right: 0, left: -30, bottom: 20 }}
                            barSize={35}
                        >
                            <defs>
                                <linearGradient id="barGradientTop" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#15803d" stopOpacity={0.8} />
                                </linearGradient>
                                <linearGradient id="barGradientOthers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6d5efc" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                                dataKey="name"
                                stroke="rgba(255,255,255,0.4)"
                                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + '..' : value}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.4)"
                                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                content={<CustomBarTooltip />}
                            />
                            <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                                {data.topProducts.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? "url(#barGradientTop)" : "url(#barGradientOthers)"}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card.Body>
        </Card>
    );
}
