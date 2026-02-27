export default function POSCartItem({ item, pInfo, currency, updateQty, apiBaseUrl }) {
    return (
        <div className="pos-cart-item mb-4">
            <div className="pos-cart-thumb">
                {pInfo?.image ? (
                    <img src={`${apiBaseUrl}${pInfo.image}`} alt="" />
                ) : (
                    <div className="thumb-placeholder">{item.name.charAt(0)}</div>
                )}
            </div>
            <div className="flex-grow-1 min-w-0 mx-2">
                <div className="fw-bold text-white text-truncate small">{item.name}</div>
                <div className="text-primary small fw-bold">
                    {currency}{item.price.toFixed(2)}
                </div>
            </div>
            <div className="d-flex align-items-center gap-2 px-1">
                <button className="btn-qty" onClick={() => updateQty(item.id, -1)}>-</button>
                <span className="fw-bold text-white small" style={{ minWidth: '15px', textAlign: 'center' }}>{item.qty}</span>
                <button className="btn-qty" onClick={() => updateQty(item.id, 1)}>+</button>
            </div>
            <div className="text-end" style={{ minWidth: '60px' }}>
                <div className="fw-bold text-white small">{currency}{item.line_total.toFixed(2)}</div>
            </div>
        </div>
    );
}
