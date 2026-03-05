import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchSettingsList, updateSetting } from "../api/settingsApi";
import { useAuth } from "../auth/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const { data: settingsData, isLoading: loading, refetch: refreshSettings } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await fetchSettingsList(token);
            return res.data;
        },
        enabled: !!token,
        staleTime: Infinity, // Settings usually don't change often
    });

    const defaultSettings = {
        business: { storeName: "POS", currency: "USD", address: "", phone: "", email: "" },
        tax: { taxRate: 0, enableTax: false, taxName: "Tax" },
        invoice: { prefix: "#", suffix: "", footerNote: "Thank you for your purchase!" },
        payment: { acceptedMethods: ["Cash"], defaultMethod: "Cash", enableChangeCalculation: true }
    };

    const settings = settingsData || defaultSettings;


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
        try {
            await updateSetting(key, value, token);
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            return true;
        } catch (err) {
            console.error(`Failed to update setting ${key}`);
            return false;
        }
    };

    return (
        <SettingsContext.Provider
            value={{ settings, currencySymbol, formatPrice, refreshSettings, updateSystemSetting, loading }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
