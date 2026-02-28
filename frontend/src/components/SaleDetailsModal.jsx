import { Modal, Button, Table } from "react-bootstrap";
import { printWindow, buildSaleDetailsPrintHTML } from "../utils/printUtils";

export default function SaleDetailsModal({ show, onHide, sale, currencySymbol, settings }) {
    if (!sale) return null;

    const handlePrint = () => {
        const html = buildSaleDetailsPrintHTML(sale, currencySymbol, settings);
        printWindow(html, `Sale Receipt - #${sale.id}`);
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="md"
            contentClassName="glass border-0"
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold">Sale Details #{sale.id}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <div className="d-flex justify-content-between mb-4">
                    <div>
                        <div className="text-muted small fw-bold">DATE</div>
                        <div>{new Date(sale.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-end">
                        <div className="text-muted small fw-bold">METHOD</div>
                        <div className="text-capitalize">{sale.payment_method}</div>
                        {sale.payment_reference && (
                            <div className="mt-2 text-primary small fw-bold">REF: {sale.payment_reference}</div>
                        )}
                    </div>
                </div>

                <Table borderless className="table-darkx bg-transparent mb-4">
                    <thead>
                        <tr className="border-bottom border-secondary">
                            <th className="bg-transparent text-muted small px-0">ITEM</th>
                            <th className="bg-transparent text-muted small text-center px-0">QTY</th>
                            <th className="bg-transparent text-muted small text-end px-0">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item, i) => (
                            <tr key={i}>
                                <td className="bg-transparent px-0 py-2">
                                    <div className="fw-bold">{item.product_name}</div>
                                    <div className="small text-muted">{currencySymbol}{parseFloat(item.price).toFixed(2)} / unit</div>
                                </td>
                                <td className="bg-transparent text-center px-0 py-2">{item.qty}</td>
                                <td className="bg-transparent text-end px-0 py-2 fw-bold">
                                    {currencySymbol}{parseFloat(item.line_total).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <div className="border-top border-secondary pt-3">
                    <div className="d-flex justify-content-between mb-1 small text-muted">
                        <span>Subtotal</span>
                        <span>{currencySymbol}{parseFloat(sale.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1 small text-muted">
                        <span>Tax</span>
                        <span>{currencySymbol}{parseFloat(sale.tax).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between h4 fw-bold text-white mt-3">
                        <span>Grand Total</span>
                        <span>{currencySymbol}{parseFloat(sale.total).toFixed(2)}</span>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-top border-secondary">
                <Button variant="outline-secondary" onClick={onHide} className="border-0">
                    Close
                </Button>
                <Button className="btn-gradient border-0 px-4" onClick={handlePrint}>
                    Print Receipt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
