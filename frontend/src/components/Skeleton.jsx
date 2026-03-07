import React from "react";

export default function Skeleton({ width, height, borderRadius = "8px", className = "" }) {
    return (
        <div
            className={`skeleton-anim ${className}`}
            style={{
                width: width || "100%",
                height: height || "1rem",
                borderRadius,
                background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
                backgroundSize: "200% 100%",
                animation: "skeleton-loading 1.5s infinite linear"
            }}
        />
    );
}
