import { Card } from "react-bootstrap";

export default function POSProductCard({ product, currency, onAdd, apiBaseUrl, discounts = [], touchMode = false }) {
    // Find applicable discounts for this product
    const applicableDiscount = discounts.find(d => {
        const hasProducts = (d.products?.length || 0) > 0;
        const hasCategories = (d.categories?.length || 0) > 0;

        // 1. If specific products are defined, strictly match them (Ignore categories)
        if (hasProducts) {
            return d.products.some(p => String(p.productId) === String(product.id));
        }

        // 2. If no products but categories defined, match category
        if (hasCategories) {
            return d.categories.some(c => String(c.categoryId) === String(product.category_id));
        }

        // 3. Global discount (no restrictions)
        return true;
    });

    const hasVariants = product.variants && product.variants.length > 0;
    const displayPrice = hasVariants
        ? Math.min(...product.variants.map(v => parseFloat(v.price || 0)))
        : parseFloat(product.price || 0);
    const displayStock = hasVariants
        ? product.variants.reduce((sum, v) => sum + parseInt(v.stock || 0), 0)
        : parseInt(product.stock || 0);

    /* ─── Touch Mode: Horizontal compact card ─── */
    if (touchMode) {
        return (
            <div
                className="pos-touch-card"
                onClick={() => onAdd(product)}
            >
                {/* Image / Placeholder */}
                <div className="pos-touch-card-img">
                    {product.image ? (
                        <img
                            src={`${apiBaseUrl}${product.image}`}
                            alt={product.name}
                        />
                    ) : (
                        <span className="pos-touch-card-placeholder">{product.name.charAt(0)}</span>
                    )}
                    {applicableDiscount && !hasVariants && (
                        <span className="pos-touch-discount-dot" title={
                            applicableDiscount.type === 'percentage'
                                ? `${parseFloat(applicableDiscount.value)}% OFF`
                                : `${currency}${parseFloat(applicableDiscount.value)} OFF`
                        }>
                            <i className="bi bi-tag-fill"></i>
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="pos-touch-card-info">
                    <div className="pos-touch-card-name">{product.name}</div>
                    <div className="pos-touch-card-meta">
                        <span className="pos-touch-category">{product.category_name || "General"}</span>
                        {hasVariants && <span className="pos-touch-variants">{product.variants.length} Variants</span>}
                        <span className={`pos-touch-stock ${displayStock < 10 ? 'low' : ''}`}>{displayStock} in stock</span>
                    </div>
                </div>

                {/* Price + Add */}
                <div className="pos-touch-card-actions">
                    <div className="pos-touch-price">
                        {hasVariants && <span className="pos-touch-price-from">From </span>}
                        {currency}{displayPrice.toFixed(2)}
                    </div>
                    <button
                        className="pos-touch-add-btn"
                        onClick={(e) => { e.stopPropagation(); onAdd(product); }}
                    >
                        <i className={`bi bi-${hasVariants ? 'list-ul' : 'plus-lg'}`}></i>
                    </button>
                </div>
            </div>
        );
    }

    /* ─── Classic Mode: Vertical grid card (unchanged) ─── */
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

                {applicableDiscount && !hasVariants && (
                    <div className="pos-discount-badge animate-pop-in">
                        <span className="badge bg-primary shadow-sm border border-white border-opacity-10">
                            <i className="bi bi-tag-fill me-1 small"></i>
                            {applicableDiscount.type === 'percentage'
                                ? `${parseFloat(applicableDiscount.value)}% OFF`
                                : `${currency}${parseFloat(applicableDiscount.value)} OFF`}
                        </span>
                    </div>
                )}

                <div className="pos-stock-badge">
                    <span className={`badge ${displayStock < 10 ? 'bg-danger' : 'bg-success'}`}>
                        {displayStock} {hasVariants ? 'Total' : ''}
                    </span>
                </div>
            </div>
            <Card.Body className="p-3 d-flex flex-column">
                <div className="small text-muted mb-1 text-uppercase ls-1">{product.category_name || "General"}</div>
                <div className="fw-bold text-white fs-6 mb-2 text-truncate">
                    {product.name}
                    {hasVariants && <div className="text-info x-small mt-1">{product.variants.length} Variants</div>}
                </div>
                <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-10">
                    <span className="h5 mb-0 text-primary fw-bold">
                        {hasVariants && <span className="fs-6 text-muted me-1">From</span>}
                        {currency}{displayPrice.toFixed(2)}
                    </span>
                    <button className="btn btn-sm btn-icon-plus">
                        <i className={`bi bi-${hasVariants ? 'list-ul' : 'plus-lg'}`}></i>
                    </button>
                </div>
            </Card.Body>
        </Card>
    );
}
