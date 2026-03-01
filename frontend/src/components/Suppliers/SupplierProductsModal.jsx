import { Modal, Spinner, Pagination, Button } from "react-bootstrap";
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
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="lg"
            contentClassName="glass border-0"
        >
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold text-white">
                    Products by {selectedSupplier?.name}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0 bg-dark overflow-hidden" style={{ minHeight: '400px' }}>
                <div className="p-3 bg-black-25 border-bottom border-secondary d-flex align-items-center gap-3">
                    <i className="bi bi-search text-primary small"></i>
                    <input
                        type="text"
                        placeholder="Search among linked products..."
                        className="bg-transparent border-0 text-white shadow-none small w-100 outline-none"
                        style={{ outline: 'none' }}
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
                        <div className="table-darkx" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            <table className="table table-borderless table-hover mb-0">
                                <thead className="sticky-top bg-dark">
                                    <tr className="border-bottom border-secondary">
                                        <th className="px-4 py-3">PRODUCT</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3 text-center">PRICE</th>
                                        <th className="px-4 py-3 text-center">STOCK</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedModalProducts.map(p => (
                                        <tr key={p.id} className="border-bottom border-secondary-subtle">
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center gap-2 text-white">
                                                    <div className="rounded bg-black-25 p-1 border border-secondary" style={{ width: '40px', height: '40px' }}>
                                                        {p.image ? (
                                                            <img src={`${apiBaseUrl}${p.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center"><i className="bi bi-image"></i></div>
                                                        )}
                                                    </div>
                                                    <span className="small">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-muted x-small">{p.sku || "---"}</td>
                                            <td className="px-4 py-3 align-middle text-center text-white small">Rs.{p.price}</td>
                                            <td className="px-4 py-3 align-middle text-center">
                                                <span className={`fw-bold small ${p.stock <= 5 ? 'text-danger' : 'text-success'}`}>{p.stock}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                    </>
                ) : (
                    <div className="text-center py-5 text-muted">
                        {productSearchTerm ? "No products match your search." : "No products found for this supplier."}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-top border-secondary bg-dark">
                <Button variant="outline-light" onClick={onHide} className="border-0">
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
