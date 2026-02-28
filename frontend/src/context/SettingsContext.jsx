import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const { token } = useAuth();
    const [settings, setSettings] = useState({
        business: { storeName: "POS", currency: "USD", address: "", phone: "", email: "" },
        tax: { taxRate: 0, enableTax: false, taxName: "Tax" },
        invoice: { prefix: "#", suffix: "", footerNote: "Thank you for your purchase!" },
        payment: { acceptedMethods: ["Cash"], defaultMethod: "Cash", enableChangeCalculation: true }
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get("/api/settings", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            console.error("Failed to load settings in Context");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const currencySymbol = (() => {
        const c = settings.business?.currency;
        if (c === 'PKR') return 'Rs';
        if (c === 'EUR') return '€';
        if (c === 'GBP') return '£';
        return '$';
    })();

    const formatPrice = (price) => {
        return `${currencySymbol}${parseFloat(price || 0).toFixed(2)}`;
    };

    const updateSystemSetting = async (key, value) => {
        if (!token) return;

        // Optimistic Update: Update local state immediately for instant feedback
        const previousSettings = settings;
        setSettings(prev => ({ ...prev, [key]: value }));

        try {
            await api.put(`/api/settings/${key}`, value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Optional: refresh from server to ensure sync, but not strictly necessary if PUT was successful
            // await fetchSettings(); 
            return true;
        } catch (err) {
            console.error(`Failed to update setting ${key}`);
            // Rollback on error
            setSettings(previousSettings);
            return false;
        }
    };

    return (
        <SettingsContext.Provider
            value={{ settings, currencySymbol, formatPrice, refreshSettings: fetchSettings, updateSystemSetting, loading }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
