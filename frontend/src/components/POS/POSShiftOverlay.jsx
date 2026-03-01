import { Button } from "react-bootstrap";

export default function POSShiftOverlay({ needsShift, activeShift, shiftLoading, onStartShift }) {
    if (shiftLoading || !needsShift || activeShift) return null;

    return (
        <div className="position-absolute top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center rounded-4" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}>
            <div className="glass p-5 border-white-10 shadow-lg text-center" style={{ maxWidth: '400px' }}>
                <div className="receipt-success-icon mb-4 border-danger bg-danger-soft">
                    <i className="bi bi-lock-fill text-danger"></i>
                </div>
                <h3 className="fw-bold mb-2">Shift Required</h3>
                <p className="text-muted mb-4 small">You must start your shift and enter an opening balance before processing any sales.</p>
                <Button
                    variant="primary"
                    className="rounded-pill px-5 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 mx-auto"
                    onClick={onStartShift}
                >
                    <i className="bi bi-clock-history"></i>
                    Start Shift
                </Button>
            </div>
        </div>
    );
}
