import React from "react";

/**
 * Custom tooltip component for Recharts charts
 */
const ChartTooltip = ({ active, payload, label, currencySymbol, labelFormatter, variant = "currency" }) => {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        const displayValue = variant === "currency"
            ? `${currencySymbol}${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `${value} units`;

        return (
            <div className="glass p-3 rounded border-0 shadow-lg" style={{ backgroundColor: "rgba(15, 23, 42, 0.95)" }}>
                <p className="fw-bold text-white mb-1">
                    {labelFormatter ? labelFormatter(label) : label}
                </p>
                <p className="mb-0 fw-bold fs-5" style={{ color: "#22c55e" }}>
                    {displayValue}
                </p>
            </div>
        );
    }
    return null;
};

export default ChartTooltip;
