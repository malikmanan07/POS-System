import { Modal, Button } from "react-bootstrap";
import { printWindow, buildReceiptPrintHTML } from "../utils/printUtils";

export default function POSReceiptModal({ show, onHide, lastSale, currency, settings }) {
    if (!lastSale) return null;

    const handlePrint = () => {
        const html = buildReceiptPrintHTML(lastSale, currency, settings);
        printWindow(html, `Receipt #${lastSale.id}`);
    };

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="glass border-0 receipt-modal">
            <Modal.Body className="p-0 text-center">
                <div className="p-5">
                    <div className="receipt-success-icon mb-4">
                        <i className="bi bi-check2"></i>
                    </div>
                    <h2 className="fw-bold text-white mb-2">Sale Complete!</h2>
                    <p className="text-muted">Transaction ID: #{lastSale.id}</p>
                    {lastSale.payment_reference && (
                        <p className="text-primary small fw-bold mb-0">Ref: {lastSale.payment_reference}</p>
                    )}
                </div>

                <div className="p-4 mx-4 mb-4 rounded-4 bg-dark bg-opacity-50 text-start">
                    <div className="receipt-items mb-3">
                        {lastSale.items?.map((item, i) => (
                            <div key={i} className="d-flex justify-content-between mb-2 small">
                                <span className="text-white-50">{item.qty}x {item.name}</span>
                                <span className="text-white">{currency}{parseFloat(item.line_total).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="d-flex justify-content-between pt-3 border-top border-secondary border-opacity-50 h4 fw-bold text-white mt-2 mb-0">
                        <span className="text-primary">TOTAL</span>
                        <span className="text-primary">{currency}{parseFloat(lastSale.total || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div className="p-4 d-flex gap-3">
                    <Button variant="soft" className="w-100 py-3 border-0" onClick={onHide}>Close</Button>
                    <Button className="btn-gradient w-100 py-3 border-0 d-flex align-items-center justify-content-center gap-2" onClick={handlePrint}>
                        <i className="bi bi-printer"></i> Print
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}
