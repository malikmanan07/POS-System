import { Card, Badge } from "react-bootstrap";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ChartTooltip from "../ChartTooltip";

export default function RevenueChart({ data, currencySymbol }) {
    return (
        <Card className="glass shadow-soft border-0 h-100">
            <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h6 className="fw-bold text-white mb-0">Revenue Overview</h6>
                        <small className="text-muted">Sales performance last 7 days</small>
                    </div>
                    <Badge className="badge-soft">
                        <i className="bi bi-circle-fill text-success me-2" style={{ fontSize: "8px" }}></i>
                        Live Data
                    </Badge>
                </div>

                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart
                            data={data.revenueData}
                            margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                                dataKey="name"
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.4)"
                                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                width={60}
                                tickFormatter={(value) => {
                                    if (value >= 1000) return `${currencySymbol}${(value / 1000).toFixed(1)}k`;
                                    return `${currencySymbol}${value}`;
                                }}
                            />
                            <Tooltip
                                content={<ChartTooltip currencySymbol={currencySymbol} />}
                                cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#22c55e"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card.Body>
        </Card>
    );
}
