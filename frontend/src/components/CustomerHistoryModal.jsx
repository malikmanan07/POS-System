import { Modal, Button, Table, Badge } from "react-bootstrap";
import { printWindow, buildHistoryPrintHTML } from "../utils/printUtils";

export default function CustomerHistoryModal({
    show,
    onHide,
    selectedCustomer,
    isLoadingHistory,
    history,
    apiBaseUrl
}) {
    const handlePrint = () => {
        if (!selectedCustomer || history.length === 0) return;
        // Resolve image URLs to absolute for print window
        const historyWithAbsImages = history.map(sale => ({
            ...sale,
            items: sale.items.map(item => ({
                ...item,
                image: item.image ? `${apiBaseUrl}${item.image}` : null
            }))
        }));
        const html = buildHistoryPrintHTML(selectedCustomer, historyWithAbsImages);
        printWindow(html, `Purchase History - ${selectedCustomer.name}`);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered contentClassName="glass border-0">
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold">Purchase History — {selectedCustomer?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
                {isLoadingHistory ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : history.length > 0 ? (
                    history.map((sale) => (
                        <div key={sale.id} className="mb-4 bg-dark bg-opacity-25 p-3 rounded-4 border border-secondary border-opacity-25">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <Badge bg="primary" className="mb-1">SALE #{sale.id}</Badge>
                                    <div className="small text-muted">{new Date(sale.created_at).toLocaleString()}</div>
                                </div>
                                <div className="text-end">
                                    <div className="fw-bold text-white fs-5">${parseFloat(sale.total).toFixed(2)}</div>
                                    <div className="small text-success">Paid: ${parseFloat(sale.paid_amount).toFixed(2)}</div>
                                    {parseFloat(sale.change_amount) > 0 && (
                                        <div className="small text-info">Change: ${parseFloat(sale.change_amount).toFixed(2)}</div>
                                    )}
                                </div>
                            </div>
                            <div className="table-responsive">
                                <Table borderless size="sm" className="text-white mb-0 bg-transparent">
                                    <thead>
                                        <tr className="border-bottom border-secondary border-opacity-25" style={{ background: 'transparent' }}>
                                            <th className="small text-muted py-2 bg-transparent text-uppercase ls-1" style={{ fontSize: '10px' }}>PRODUCT</th>
                                            <th className="small text-muted py-2 text-center bg-transparent text-uppercase ls-1" style={{ fontSize: '10px' }}>QTY</th>
                                            <th className="small text-muted py-2 text-end bg-transparent text-uppercase ls-1" style={{ fontSize: '10px' }}>PRICE</th>
                                            <th className="small text-muted py-2 text-end bg-transparent text-uppercase ls-1" style={{ fontSize: '10px' }}>TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.map((item, idx) => (
                                            <tr key={idx} className="align-middle border-bottom border-white border-opacity-5">
                                                <td className="py-2 bg-transparent text-white">
                                                    <div className="d-flex align-items-center gap-2">
                                                        {item.image ? (
                                                            <img src={`${apiBaseUrl}${item.image}`} alt="" className="rounded shadow-sm" style={{ width: '35px', height: '35px', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div className="rounded bg-primary bg-opacity-20 text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: '35px', height: '35px', fontSize: '12px' }}>{item.name.charAt(0)}</div>
                                                        )}
                                                        <span className="small fw-semibold text-white">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 text-center small bg-transparent text-white">{item.qty}</td>
                                                <td className="py-2 text-end small bg-transparent text-white-50">${parseFloat(item.price).toFixed(2)}</td>
                                                <td className="py-2 text-end small fw-bold bg-transparent text-primary">${parseFloat(item.line_total).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-5 text-muted">No purchase history found</div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-top border-secondary">
                <Button variant="outline-light" onClick={onHide} className="border-0 btn-soft">
                    Close
                </Button>
                <Button
                    className="btn-gradient border-0 px-4 d-flex align-items-center gap-2"
                    onClick={handlePrint}
                    disabled={history.length === 0 || isLoadingHistory}
                >
                    <i className="bi bi-printer"></i> Print History
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
