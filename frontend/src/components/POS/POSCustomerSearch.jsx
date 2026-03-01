import { useState, useMemo } from "react";
import { Form } from "react-bootstrap";
import QuickAddCustomer from "../QuickAddCustomer";

export default function POSCustomerSearch({
    customers,
    selectedCustomer,
    onSelectCustomer,
    onAddCustomer,
    isSavingCustomer
}) {
    const [customerSearch, setCustomerSearch] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "" });

    const searchedCustomers = useMemo(() => {
        if (!customerSearch.trim()) return [];
        return customers.filter(c =>
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(customerSearch))
        );
    }, [customers, customerSearch]);

    const selectedCustomerName = useMemo(() => {
        if (!selectedCustomer) return "Walk-in Customer";
        const c = customers.find(cust => String(cust.id) === String(selectedCustomer));
        return c ? c.name : "Walk-in Customer";
    }, [selectedCustomer, customers]);

    const handleAdd = async (e) => {
        const success = await onAddCustomer(newCustomer);
        if (success) {
            setShowAddForm(false);
            setNewCustomer({ name: "", phone: "", email: "", address: "" });
        }
    };

    return (
        <div className="p-4 border-bottom border-secondary-subtle">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0">Current Order</h4>
            </div>

            {!showAddForm ? (
                <div className="position-relative">
                    <div className="d-flex gap-2">
                        <div className="customer-select-wrapper flex-grow-1 position-relative">
                            <i className="bi bi-person-circle text-muted"></i>
                            <Form.Control
                                type="text"
                                placeholder={selectedCustomer ? selectedCustomerName : "Search Customer..."}
                                className="pos-customer-select bg-dark text-white border-0"
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                                style={{ paddingLeft: '35px' }}
                            />
                            {selectedCustomer && (
                                <button
                                    className="btn btn-link btn-sm position-absolute end-0 top-50 translate-middle-y text-muted opacity-50 pe-3"
                                    onClick={() => {
                                        onSelectCustomer("");
                                        setCustomerSearch("");
                                    }}
                                >
                                    <i className="bi bi-x-circle"></i>
                                </button>
                            )}
                        </div>
                        <button
                            className="btn btn-soft px-3 flex-shrink-0"
                            title="Add New Customer"
                            onClick={() => setShowAddForm(true)}
                        >
                            <i className="bi bi-person-plus-fill"></i>
                        </button>
                    </div>

                    {showResults && customerSearch.trim() && (
                        <div
                            className="glass position-absolute w-100 mt-1 shadow-lg overflow-auto"
                            style={{
                                zIndex: 1000,
                                maxHeight: '200px',
                                backgroundColor: 'rgba(15, 23, 42, 0.98)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {searchedCustomers.length > 0 ? (
                                searchedCustomers.map(c => (
                                    <div
                                        key={c.id}
                                        className="p-3 border-bottom border-secondary-subtle cursor-pointer hover-bg-white-5"
                                        onClick={() => {
                                            onSelectCustomer(c.id);
                                            setCustomerSearch("");
                                            setShowResults(false);
                                        }}
                                    >
                                        <div className="fw-bold text-white small">{c.name}</div>
                                        {c.phone && <div className="text-muted x-small">{c.phone}</div>}
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-center text-muted small">
                                    No customer found matching "{customerSearch}"
                                </div>
                            )}
                        </div>
                    )}

                    {showResults && (
                        <div
                            className="position-fixed top-0 start-0 w-100 h-100"
                            style={{ zIndex: 999 }}
                            onClick={() => setShowResults(false)}
                        />
                    )}
                </div>
            ) : (
                <QuickAddCustomer
                    newCustomer={newCustomer}
                    setNewCustomer={setNewCustomer}
                    handleQuickAddCustomer={handleAdd}
                    setShowAddCustomer={setShowAddForm}
                    isSavingCustomer={isSavingCustomer}
                />
            )}
        </div>
    );
}
