import { Card } from "react-bootstrap";

export default function POSProductCard({ product, currency, onAdd, apiBaseUrl }) {
    return (
        <Card
            className="pos-product-card border-0 h-100"
            onClick={() => onAdd(product)}
        >
            <div className="pos-card-img-wrapper">
                {product.image ? (
                    <img
                        src={`${apiBaseUrl}${product.image}`}
                        alt={product.name}
                        className="pos-card-img"
                    />
                ) : (
                    <div className="pos-card-placeholder">
                        <span>{product.name.charAt(0)}</span>
                    </div>
                )}
                <div className="pos-stock-badge">
                    <span className={`badge ${product.stock < 10 ? 'bg-danger' : 'bg-success'}`}>
                        {product.stock}
                    </span>
                </div>
            </div>
            <Card.Body className="p-3 d-flex flex-column">
                <div className="small text-muted mb-1 text-uppercase ls-1">{product.category_name || "General"}</div>
                <div className="fw-bold text-white fs-6 mb-2 text-truncate">{product.name}</div>
                <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-10">
                    <span className="h5 mb-0 text-primary fw-bold">{currency}{parseFloat(product.price).toFixed(2)}</span>
                    <button className="btn btn-sm btn-icon-plus">
                        <i className="bi bi-plus-lg"></i>
                    </button>
                </div>
            </Card.Body>
        </Card>
    );
}

