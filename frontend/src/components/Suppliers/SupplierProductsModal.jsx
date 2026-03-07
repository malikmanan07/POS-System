import { Modal, Spinner, Table, Tabs, Tab, Badge } from "react-bootstrap";
import { useEffect, useState, Fragment } from "react";
import { fetchSupplierHistory } from "../../api/customerSupplierApi";
import { useAuth } from "../../auth/AuthContext";
import PaginationControl from "../PaginationControl";

export default function SupplierProductsModal({
    show,
    onHide,
    selectedSupplier,
    productSearchTerm,
    setProductSearchTerm,
    loadingProducts,
    paginatedModalProducts,
    productPagination,
    setProductPagination,
    modalTotalPages,
    filteredModalProducts,
    apiBaseUrl
}) {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState("products");
    const [history, setHistory] = useState([]);
    const [totalPurchased, setTotalPurchased] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historySearchTerm, setHistorySearchTerm] = useState("");
    const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 10 });

    useEffect(() => {
        if (show && activeTab === "history" && selectedSupplier) {
            loadHistory();
        }
    }, [show, activeTab, selectedSupplier]);

    useEffect(() => {
        if (show) setActiveTab("products");
    }, [show]);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetchSupplierHistory(selectedSupplier.id, token);
            setHistory(res.data.history || []);
            setTotalPurchased(res.data.totalPurchased || 0);
        } catch (err) {
            console.error("Error loading history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const filteredHistory = history.filter(h => {
        if (!historySearchTerm) return true;
        const s = historySearchTerm.toLowerCase();
        return (
            h.productName?.toLowerCase().includes(s) ||
            h.sku?.toLowerCase().includes(s) ||
            h.reference?.toLowerCase().includes(s)
        );
    });

    const paginatedHistory = filteredHistory.slice(
        (historyPagination.page - 1) * historyPagination.limit,
        historyPagination.page * historyPagination.limit
    );

    const historyTotalPages = Math.ceil(filteredHistory.length / historyPagination.limit);

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="xl"
            contentClassName="glass border-0"
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold text-white d-flex align-items-center gap-2">
                    <i className="bi bi-person-badge-fill text-primary"></i>
                    Supplier Ledger: {selectedSupplier?.name}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0 bg-dark overflow-hidden" style={{ minHeight: '500px' }}>
                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="custom-tabs border-bottom border-secondary"
                    fill
                >
                    <Tab eventKey="products" title={<span><i className="bi bi-box-seam me-2"></i>Linked Products</span>}>
                        <div className="p-3 bg-black-25 border-bottom border-secondary d-flex align-items-center gap-3">
                            <i className="bi bi-search text-primary small"></i>
                            <input
                                type="text"
                                placeholder="Search among linked products..."
                                className="bg-transparent border-0 text-white shadow-none small w-100 outline-none"
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                            />
                        </div>

                        {loadingProducts ? (
                            <div className="d-flex flex-column align-items-center justify-content-center py-5">
                                <Spinner animation="border" variant="primary" className="mb-2" />
                                <span className="text-muted">Fetching product information...</span>
                            </div>
                        ) : paginatedModalProducts.length > 0 ? (
                            <>
                                <div className="table-responsive" style={{ maxHeight: '420px' }}>
                                    <Table borderless hover className="table-dark mb-0">
                                        <thead className="sticky-top bg-dark">
                                            <tr className="border-bottom border-secondary">
                                                <th className="px-4 py-3">PRODUCT</th>
                                                <th className="px-4 py-3">SKU</th>
                                                <th className="px-4 py-3 text-center">PURCHASE PRICE</th>
                                                <th className="px-4 py-3 text-center">TOTAL PRICE</th>
                                                <th className="px-4 py-3 text-center">STOCK</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedModalProducts.map(p => (
                                                <Fragment key={p.id}>
                                                    <tr className="border-bottom border-secondary-subtle">
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="rounded bg-black-25 p-1 border border-secondary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                                    {p.image ? (
                                                                        <img src={`${apiBaseUrl}${p.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <i className="bi bi-image"></i>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="small text-white fw-bold">{p.name}</div>
                                                                    {p.productBatches?.length > 0 && (
                                                                        <Badge bg="primary" className="x-small pill mt-1" style={{ cursor: 'default' }}>
                                                                            {p.productBatches.length} Batches Active
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 align-middle text-muted x-small">{p.sku || "---"}</td>
                                                        <td className="px-4 py-3 align-middle text-center text-emerald fw-bold small">
                                                            Rs.{parseFloat(p.costPrice || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 align-middle text-center text-white small">
                                                            Rs.{(parseFloat(p.costPrice || 0) * (p.stock || 0)).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 align-middle text-center">
                                                            <Badge bg={p.stock <= 5 ? 'danger' : 'success'} className="pill fw-bold">
                                                                {p.stock}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    {p.productBatches?.length > 0 && (
                                                        <tr>
                                                            <td colSpan="5" className="p-0 border-0">
                                                                <div className="bg-black-10 m-2 p-3 rounded border border-secondary">
                                                                    <div className="x-small text-muted mb-2 text-uppercase fw-bold ls-1"><i className="bi bi-layers-fill me-1"></i> Active Stock Batches</div>
                                                                    <div className="table-responsive">
                                                                        <table className="table table-sm table-borderless mb-0">
                                                                            <thead>
                                                                                <tr className="text-muted small border-bottom border-secondary">
                                                                                    <th className="py-1">Batch # / Ref</th>
                                                                                    <th className="py-1">Purchased</th>
                                                                                    <th className="py-1 text-center">Remaining</th>
                                                                                    <th className="py-1 text-end">Purchase Cost</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {p.productBatches.map(b => (
                                                                                    <tr key={b.id} className="small text-white-50">
                                                                                        <td className="py-2">
                                                                                            <span className="text-white">{b.batchNumber}</span>
                                                                                        </td>
                                                                                        <td className="py-2">{new Date(b.createdAt).toLocaleDateString()}</td>
                                                                                        <td className="py-2 text-center">
                                                                                            <span className="text-primary fw-bold">{b.remainingQty}</span> / {b.originalQty}
                                                                                        </td>
                                                                                        <td className="py-2 text-end text-emerald">Rs.{parseFloat(b.purchasePrice).toLocaleString()}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="p-3 border-top border-secondary">
                                    <PaginationControl
                                        pagination={{
                                            ...productPagination,
                                            total: filteredModalProducts.length,
                                            pages: modalTotalPages
                                        }}
                                        setPage={(page) => setProductPagination(prev => ({ ...prev, page }))}
                                    />
                                </div>
                                <div className="p-3 bg-black-25 border-top border-secondary">
                                    <div className="text-muted small">Total records: <strong>{filteredModalProducts.length}</strong></div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                {productSearchTerm ? "No products match your search." : "No products found for this supplier."}
                            </div>
                        )}
                    </Tab>

                    <Tab eventKey="history" title={<span><i className="bi bi-clock-history me-2"></i>Purchase History</span>}>
                        {loadingHistory ? (
                            <div className="d-flex flex-column align-items-center justify-content-center py-5">
                                <Spinner animation="border" variant="primary" className="mb-2" />
                                <span className="text-muted">Loading purchase records...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 bg-black-25 border-bottom border-secondary d-flex align-items-center gap-3">
                                    <i className="bi bi-search text-primary small"></i>
                                    <input
                                        type="text"
                                        placeholder="Search in purchase history..."
                                        className="bg-transparent border-0 text-white shadow-none small w-100 outline-none"
                                        value={historySearchTerm}
                                        onChange={(e) => {
                                            setHistorySearchTerm(e.target.value);
                                            setHistoryPagination(prev => ({ ...prev, page: 1 }));
                                        }}
                                    />
                                </div>
                                {filteredHistory.length > 0 ? (
                                    <>
                                        <div className="table-responsive" style={{ maxHeight: '420px' }}>
                                            <Table borderless hover className="table-dark mb-0">
                                                <thead className="sticky-top bg-dark">
                                                    <tr className="border-bottom border-secondary">
                                                        <th className="px-4 py-3">DATE</th>
                                                        <th className="px-4 py-3">PRODUCT</th>
                                                        <th className="px-4 py-3 text-center">QTY</th>
                                                        <th className="px-4 py-3 text-center">RATE</th>
                                                        <th className="px-4 py-3 text-end">TOTAL</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedHistory.map(h => (
                                                        <tr key={h.id} className="border-bottom border-secondary-subtle">
                                                            <td className="px-4 py-3 align-middle small text-muted">
                                                                {new Date(h.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-3 align-middle">
                                                                <div className="small text-white">{h.productName}</div>
                                                                <div className="x-small text-muted">{h.sku}</div>
                                                            </td>
                                                            <td className="px-4 py-3 align-middle text-center fw-bold">+{h.qty}</td>
                                                            <td className="px-4 py-3 align-middle text-center small text-emerald">
                                                                Rs.{parseFloat(h.purchasePrice || 0).toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 align-middle text-end text-white fw-bold">
                                                                Rs.{parseFloat(h.totalCost || 0).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                        <div className="p-3 border-top border-secondary">
                                            <PaginationControl
                                                pagination={{
                                                    ...historyPagination,
                                                    total: filteredHistory.length,
                                                    pages: historyTotalPages
                                                }}
                                                setPage={(page) => setHistoryPagination(prev => ({ ...prev, page }))}
                                            />
                                        </div>
                                        <div className="p-4 bg-black-25 border-top border-secondary d-flex justify-content-between align-items-center">
                                            <div className="text-muted">Total records: <strong>{filteredHistory.length}</strong></div>
                                            <div className="text-white h5 mb-0 d-flex gap-3 align-items-center">
                                                <span className="text-muted small fw-normal">GRAND TOTAL PURCHASE:</span>
                                                <span className="text-primary fw-800">Rs.{parseFloat(totalPurchased).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        {historySearchTerm ? "No records match your search." : "No purchase records found for this supplier."}
                                    </div>
                                )}
                            </>
                        )}
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
}
