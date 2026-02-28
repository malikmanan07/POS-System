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

    return (
        <SettingsContext.Provider
            value={{ settings, currencySymbol, formatPrice, refreshSettings: fetchSettings, loading }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
