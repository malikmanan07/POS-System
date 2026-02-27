import { Form, Button } from "react-bootstrap";

export default function QuickAddCustomer({
    newCustomer,
    setNewCustomer,
    handleQuickAddCustomer,
    setShowAddCustomer,
    isSavingCustomer
}) {
    return (
        <div className="quick-add-customer p-3 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-25">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold text-primary">NEW CUSTOMER</span>
                <button className="btn-close btn-close-white small" style={{ fontSize: '0.6rem' }} onClick={() => setShowAddCustomer(false)}></button>
            </div>
            <Form onSubmit={handleQuickAddCustomer}>
                <Form.Control
                    size="sm"
                    placeholder="Name *"
                    className="bg-dark border-secondary text-white mb-2 shadow-none"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    required
                />
                <Form.Control
                    size="sm"
                    placeholder="Phone"
                    className="bg-dark border-secondary text-white mb-2 shadow-none"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
                <Form.Control
                    size="sm"
                    type="email"
                    placeholder="Email"
                    className="bg-dark border-secondary text-white mb-2 shadow-none"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
                <Form.Control
                    size="sm"
                    as="textarea"
                    rows={2}
                    placeholder="Address"
                    className="bg-dark border-secondary text-white mb-2 shadow-none"
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
                <div className="d-flex gap-2">
                    <Button size="sm" variant="primary" type="submit" className="w-100" disabled={isSavingCustomer}>
                        {isSavingCustomer ? "Saving..." : "Save Customer"}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
