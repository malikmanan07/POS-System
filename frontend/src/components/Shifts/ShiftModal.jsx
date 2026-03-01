import { useState, useEffect } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { useShift } from "../../context/ShiftContext";
import { toast } from "react-toastify";

export default function ShiftModal({ show, onHide, type = 'start', currencySymbol }) {
    const { startShift, endShift, activeShift, fetchActiveShift } = useShift();
    const [balance, setBalance] = useState("0");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            if (type === 'end') {
                fetchActiveShift(); // Refresh data to get latest sales
            } else {
                setBalance("0");
            }
        }
    }, [show, type]);

    useEffect(() => {
        if (show && type === 'end' && activeShift?.expectedCash !== undefined) {
            setBalance(activeShift.expectedCash.toString());
        }
    }, [activeShift, show, type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const label = type === 'start' ? "Opening balance" : "Closing balance";
        if (parseFloat(balance) < 0) return toast.error(`${label} cannot be negative`);
        setLoading(true);

        let success = false;
        if (type === 'start') {
            success = await startShift(balance);
        } else {
            const result = await endShift(balance, note);
            success = !!result;
        }

        setLoading(false);
        if (success) {
            setBalance("0");
            setNote("");
            onHide();
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="glass border-white-10 shadow-lg text-white">
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-white-10">
                <Modal.Title className="fw-bold fs-4 text-white">
                    {type === 'start' ? '🚀 Start New Shift' : '🔒 End Daily Shift'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <p className="text-muted small mb-4">
                        {type === 'start'
                            ? "Enter the opening balance currently in your cash drawer."
                            : "Enter the final cash amount in your drawer."}
                    </p>

                    <Form.Group className="mb-4">
                        <Form.Label className="tiny fw-bold text-muted mb-2 ls-1 uppercase">
                            {type === 'start' ? 'OPENING BALANCE' : 'ACTUAL CASH IN DRAWER'}
                        </Form.Label>
                        <div className="pos-amount-input-wrapper d-flex align-items-center bg-black bg-opacity-25 rounded-4 p-1 border border-white-10 focus-within-glow">
                            <span className="ps-3 text-primary fw-bold h4 mb-0">{currencySymbol}</span>
                            <Form.Control
                                type="number"
                                step="any"
                                min="0"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                placeholder={type === 'end' ? (activeShift?.expectedCash?.toString() || "0.00") : "0.00"}
                                className="bg-transparent border-0 text-white fs-2 fw-800 text-end shadow-none p-3 px-4 flex-grow-1"
                                required
                                autoFocus
                            />
                        </div>
                    </Form.Group>

                    {type === 'end' && (
                        <Form.Group className="mb-3">
                            <Form.Label className="tiny fw-bold text-muted mb-2">ADDITIONAL NOTE</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Any discrepancies or remarks..."
                                className="bg-black bg-opacity-25 border-white-10 text-white small rounded-3 p-3"
                            />
                        </Form.Group>
                    )}

                    {type === 'end' && activeShift && (
                        <div className="mt-4 p-3 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-20 d-flex justify-content-between align-items-center">
                            <div className="d-flex flex-column text-center flex-grow-1">
                                <span className="x-small text-muted fw-bold">STARTED</span>
                                <span className="small fw-bold text-white">{new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="divider-vertical mx-2 bg-white opacity-10" style={{ height: '30px', width: '1px' }}></div>
                            <div className="d-flex flex-column text-center flex-grow-1">
                                <span className="x-small text-muted fw-bold">OPENING</span>
                                <span className="small fw-bold text-white">{currencySymbol}{parseFloat(activeShift.openingBalance).toFixed(2)}</span>
                            </div>
                            <div className="divider-vertical mx-2 bg-white opacity-10" style={{ height: '30px', width: '1px' }}></div>
                            <div className="d-flex flex-column text-center flex-grow-1">
                                <span className="x-small text-muted fw-bold">EXPECTED CASH</span>
                                <span className="small fw-bold text-primary">{currencySymbol}{parseFloat(activeShift.expectedCash || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0 gap-3">
                    <Button variant="link" onClick={onHide} className="text-muted text-decoration-none small fw-bold hover-white me-auto">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant={type === 'start' ? 'primary' : 'danger'}
                        className={`rounded-pill px-5 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 ${type === 'start' ? 'btn-gradient border-0' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            <i className={`bi bi-${type === 'start' ? 'door-open-fill' : 'lock-fill'}`}></i>
                        )}
                        {type === 'start' ? 'Open Drawer' : 'Close & Lock'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
