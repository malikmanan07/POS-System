import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchSettingsList, saveSettingsSection } from "../api/settingsApi";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";

export default function useSettingsLogic() {
    const [activeTab, setActiveTab] = useState("business");
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();
    const { refreshSettings } = useSettings();

    const [settings, setSettings] = useState({
        business: {
            storeName: "",
            address: "",
            phone: "",
            email: "",
            currency: "USD",
            logo: null
        },
        tax: {
            taxName: "GST",
            taxRate: 0,
            enableTax: false
        },
        invoice: {
            prefix: "INV-",
            suffix: "",
            footerNote: ""
        },
        payment: {
            acceptedMethods: ["Cash"],
            defaultMethod: "Cash",
            enableChangeCalculation: true
        }
    });

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        if (token) fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetchSettingsList(token);
            const fetched = res.data;
            if (fetched.payment?.acceptedMethods) {
                fetched.payment.acceptedMethods = fetched.payment.acceptedMethods.filter(m => m !== "Wallet");
            }

            setSettings(prev => {
                const updated = {
                    ...prev,
                    ...fetched,
                    business: {
                        ...prev.business,
                        ...fetched.business,
                        email: user?.email || fetched.business?.email || ""
                    }
                };
                if (updated.business.logo) setLogoPreview(updated.business.logo);
                return updated;
            });
        } catch (err) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        try {
            if (activeTab === "business" && logoFile) {
                const formData = new FormData();
                formData.append("logo", logoFile);
                formData.append("storeName", settings.business.storeName);
                formData.append("address", settings.business.address);
                formData.append("phone", settings.business.phone);
                formData.append("currency", settings.business.currency);
                formData.append("email", user?.email || settings.business.email);

                await saveSettingsSection("business", formData, token);
            } else {
                const sectionData = { ...settings[activeTab] };
                if (activeTab === "business") {
                    sectionData.email = user?.email || sectionData.email;
                }
                await saveSettingsSection(activeTab, sectionData, token);
            }

            await refreshSettings();
            toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings saved successfully!`);
        } catch (err) {
            toast.error("Failed to save settings");
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setSettings(prev => ({
            ...prev,
            business: { ...prev.business, logo: null }
        }));
    };

    return {
        activeTab,
        setActiveTab,
        loading,
        settings,
        logoPreview,
        setLogoFile,
        setLogoPreview,
        handleChange,
        handleSave,
        handleRemoveLogo,
        user
    };
}
