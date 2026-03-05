import { Row, Col, Button } from "react-bootstrap";
import POSProductCard from "../POSProductCard";

export default function POSProductGrid({
    products,
    paginatedProducts,
    onAdd,
    currency,
    apiBaseUrl,
    onSearchClear,
    onNavigateToProducts,
    currentPage,
    totalPages,
    onPageChange,
    discounts = []
}) {
    return (
        <>
            <div className="flex-grow-1 overflow-auto pe-2 pos-products-grid">
                {products.length === 0 ? (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 glass rounded-4 border-white-10 opacity-75">
                        <i className="bi bi-box-seam-fill fs-1 text-primary mb-3"></i>
                        <h4 className="fw-bold text-white">No Products Registered</h4>
                        <p className="text-muted small">Go to Products page to add items to your inventory.</p>
                        <Button variant="outline-primary" className="rounded-pill px-4 mt-2" onClick={onNavigateToProducts}>
                            Go to Products
                        </Button>
                    </div>
                ) : paginatedProducts.length === 0 ? (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 glass rounded-4 border-white-10 opacity-75">
                        <i className="bi bi-search fs-1 text-muted mb-3"></i>
                        <h4 className="fw-bold text-white">No Match Found</h4>
                        <p className="text-muted small">Try adjusting your search or category filters.</p>
                        <Button variant="link" className="text-primary mt-2 p-0 text-decoration-none" onClick={onSearchClear}>
                            Clear all filters
                        </Button>
                    </div>
                ) : (
                    <Row className="g-3 pb-3">
                        {paginatedProducts.map(p => (
                            <Col key={p.id} xs={6} sm={6} md={4} lg={4}>
                                <POSProductCard
                                    product={p}
                                    onAdd={onAdd}
                                    currency={currency}
                                    apiBaseUrl={apiBaseUrl}
                                    discounts={discounts}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-4 pos-pagination-wrapper mx-auto" style={{ width: 'fit-content' }}>
                    <Button
                        variant="glass"
                        className="btn-glass"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <i className="bi bi-chevron-left text-white fs-5"></i>
                    </Button>
                    <div className="glass px-4 h-100 d-flex align-items-center fw-bold text-primary pagination-number">
                        {currentPage} / {totalPages}
                    </div>
                    <Button
                        variant="glass"
                        className="btn-glass"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        <i className="bi bi-chevron-right text-white fs-5"></i>
                    </Button>
                </div>
            )}
        </>
    );
}
