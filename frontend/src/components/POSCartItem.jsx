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
            <div className="flex-grow-1 min-w-0 mx-2 d-flex flex-column" style={{ overflow: 'hidden' }}>
                <div className="fw-bold text-white text-truncate small" title={item.name}>{item.name}</div>
                <div className="text-primary x-small fw-bold">
                    {currency}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
                <button className="btn-qty" onClick={() => updateQty(item.id, -1)}>-</button>
                <span className="fw-bold text-white x-small" style={{ minWidth: '18px', textAlign: 'center' }}>{item.qty}</span>
                <button className="btn-qty" onClick={() => updateQty(item.id, 1)}>+</button>
            </div>
            <div className="text-end flex-shrink-0" style={{ minWidth: '70px' }}>
                <div className="fw-bold text-white x-small" style={{ whiteSpace: 'nowrap' }}>
                    {currency}{item.line_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
        </div>
    );
}
