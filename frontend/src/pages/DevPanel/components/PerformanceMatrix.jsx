import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const PerformanceMatrix = ({
    graphView,
    setGraphView,
    dateRange,
    totalItems,
    networkRevenueBreakdown,
    signupTrend,
    performanceDataTrend,
    topBusinessesNames,
    getChartColor
}) => {
    return (
        <div className="mb-5">
            <div className="glass shadow-soft p-4" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'white' }}>Network Performance Growth Matrix</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                            {graphView === 'signups' ? 'Trends of new business registrations' :
                                dateRange === 'today' ? 'Today\'s performance' :
                                    dateRange === '30days' ? 'Last 30 days revenue trend' :
                                        dateRange === 'thisMonth' ? 'Current month performance' :
                                            '7-Day revenue comparison of all businesses'}
                        </p>
                    </div>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div className="glass d-flex p-1" style={{ borderRadius: '12px', background: 'rgba(30, 41, 59, 0.4)' }}>
                            <button
                                onClick={() => setGraphView('revenue')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: graphView === 'revenue' ? '#6366f1' : 'transparent',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    transition: '0.3s'
                                }}
                            >Revenue View</button>
                            <button
                                onClick={() => setGraphView('signups')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: graphView === 'signups' ? '#10b981' : 'transparent',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    transition: '0.3s'
                                }}
                            >Signup Trend</button>
                        </div>
                        <div className="d-flex flex-wrap gap-4 align-items-center ms-lg-3">
                            <div className="text-center px-3 border-end border-secondary border-opacity-25">
                                <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Total Stores</p>
                                <p style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'white' }}>{totalItems}</p>
                            </div>
                            {networkRevenueBreakdown.map((item, idx) => (
                                <div key={idx} className="text-center px-3">
                                    <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Total {item.currency}</p>
                                    <p style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#10b981' }}>
                                        {parseFloat(item.revenue).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {graphView === 'signups' ? (
                            <BarChart data={signupTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        ) : (
                            <AreaChart data={performanceDataTrend}>
                                <defs>
                                    {topBusinessesNames.map((name, i) => (
                                        <linearGradient key={`grad-${i}`} id={`grad-top-${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={getChartColor(i)} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={getChartColor(i)} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    padding={{ left: 10, right: 10 }}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val > 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                />
                                {topBusinessesNames.map((name, i) => (
                                    <Area
                                        key={name}
                                        type="monotone"
                                        dataKey={name}
                                        stroke={getChartColor(i)}
                                        fillOpacity={1}
                                        fill={`url(#grad-top-${i})`}
                                        strokeWidth={3}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
                <div className="d-flex justify-content-center flex-wrap gap-4 mt-3">
                    {topBusinessesNames.map((name, i) => (
                        <div key={name} className="d-flex align-items-center gap-2">
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getChartColor(i) }}></div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PerformanceMatrix;
