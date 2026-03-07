import React from "react";
import { Card } from "react-bootstrap";
import Skeleton from "./Skeleton";

/**
 * A reusable KPI/Stat card with an icon and optional color theme.
 */
const StatCard = ({ title, value, icon, color = "#6d5efc", hint, loading }) => {
    return (
        <Card className="glass shadow-soft border-0 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
                <div className="overflow-hidden flex-grow-1">
                    <p className="text-muted small mb-1 text-truncate">{title}</p>
                    {loading ? (
                        <Skeleton height="1.8rem" width="80%" className="mt-1" />
                    ) : (
                        <h4 className="fw-bold text-white mb-0">{value}</h4>
                    )}
                    {hint && (
                        loading ? <Skeleton height="0.8rem" width="40%" className="mt-2" /> : <div className="small text-muted mt-1">{hint}</div>
                    )}
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                    style={{
                        width: '45px',
                        height: '45px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: color
                    }}>
                    <i className={`bi ${icon} fs-4`}></i>
                </div>
            </div>
        </Card>
    );
};

export default StatCard;
