import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Table, Badge, Button, Form } from "react-bootstrap";
import ShiftTable from "../components/Shifts/ShiftTable";
import PaginationControl from "../components/PaginationControl";

export default function Shifts() {
    const [shifts, setShifts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const { token, hasPermission } = useAuth();
    const { currencySymbol } = useSettings();

    useEffect(() => {
        fetchShifts();
    }, [page]);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/shifts?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShifts(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            toast.error("Failed to load shift history");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title mb-1">Shift Management</h2>
                    <p className="text-white opacity-75 mb-0">Track employee shifts and cash balances</p>
                </div>
                <Button
                    variant="soft"
                    className="d-flex align-items-center gap-2"
                    onClick={() => page === 1 ? fetchShifts() : setPage(1)}
                >
                    <i className="bi bi-arrow-clockwise"></i>
                    Refresh
                </Button>
            </div>

            <div className="glass p-4 mb-4 border-white-10">
                <ShiftTable
                    loading={loading}
                    shifts={shifts}
                    currencySymbol={currencySymbol}
                    isAdmin={hasPermission("manage_users")}
                />
                <PaginationControl
                    pagination={pagination}
                    setPage={setPage}
                />
            </div>
        </div>
    );
}
