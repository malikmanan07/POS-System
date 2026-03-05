import { useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchShiftsList } from "../api/shiftApi";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Button } from "react-bootstrap";
import ShiftTable from "../components/Shifts/ShiftTable";
import PaginationControl from "../components/PaginationControl";

export default function Shifts() {
    const [page, setPage] = useState(1);
    const { token, hasPermission } = useAuth();
    const { currencySymbol } = useSettings();
    const queryClient = useQueryClient();

    const { data: shiftsData, isLoading: loading } = useQuery({
        queryKey: ["shifts", page],
        queryFn: async () => {
            const res = await fetchShiftsList(page, 10, token);
            return res.data;
        },
        enabled: !!token,
        placeholderData: keepPreviousData
    });

    const shifts = shiftsData?.data || [];
    const pagination = shiftsData?.pagination || { page, pages: 1, total: 0, limit: 10 };

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
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["shifts"] })}
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
