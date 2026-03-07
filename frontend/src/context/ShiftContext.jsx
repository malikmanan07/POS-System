import { createContext, useContext, useState, useEffect } from "react";
import { fetchCurrentShift, startShift as apiStartShift, endShift as apiEndShift } from "../api/shiftApi";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-toastify";

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [activeShift, setActiveShift] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchActiveShift();
        else {
            setActiveShift(null);
            setLoading(false);
        }
    }, [token]);

    const fetchActiveShift = async () => {
        setLoading(true);
        try {
            const res = await fetchCurrentShift(token);
            setActiveShift(res.data);
        } catch (err) {
            console.error("Error fetching shift:", err);
        } finally {
            setLoading(false);
        }
    };

    const startShift = async (openingBalance) => {
        try {
            const res = await apiStartShift({ openingBalance }, token);
            setActiveShift(res.data);
            toast.success("Shift started successfully");
            return true;
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to start shift");
            return false;
        }
    };

    const endShift = async (closingBalance, note) => {
        try {
            const res = await apiEndShift({ closingBalance, note }, token);
            setActiveShift(null);
            toast.success("Shift ended successfully");
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to end shift");
            return null;
        }
    };

    return (
        <ShiftContext.Provider value={{ activeShift, loading, startShift, endShift, fetchActiveShift }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShift = () => useContext(ShiftContext);
