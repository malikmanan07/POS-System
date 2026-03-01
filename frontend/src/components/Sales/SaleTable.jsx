export default function SaleTable({
    loading,
    sales,
    pagination,
    currencySymbol,
    isCashierLike,
    handleViewDetail,
    handleReturn
}) {
    return (
        <div className="table-darkx shadow-soft border-white-10">
            <table className="table table-borderless table-hover mb-0">
                <thead>
                    <tr>
                        <th className="px-4 py-3 fw-bold small">#</th>
                        <th className="px-4 py-3 fw-bold small">DATE</th>
                        <th className="px-4 py-3 fw-bold small">CUSTOMER</th>
                        <th className="px-4 py-3 fw-bold small">TOTAL</th>
                        <th className="px-4 py-3 text-center fw-bold small">PAYMENT</th>
                        {!isCashierLike && <th className="px-4 py-3 fw-bold small">CASHIER</th>}
                        <th className="px-4 py-3 text-end fw-bold small">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="7" className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </td>
                        </tr>
                    ) : sales.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="text-center py-5 opacity-50 italic">
                                <i className="bi bi-inbox-fill h2 d-block mb-2"></i>
                                No sales found
                            </td>
                        </tr>
                    ) : (
                        sales.map((s, index) => (
                            <tr key={s.id} className="align-middle">
                                <td className="px-4 py-3 text-muted">
                                    {pagination.total - ((pagination.page - 1) * pagination.limit) - index}
                                </td>
                                <td className="px-4 py-3 small text-muted">
                                    {new Date(s.created_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="rounded-circle bg-dark border border-secondary d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                            <i className="bi bi-person small text-muted"></i>
                                        </div>
                                        <span className="fw-medium">
                                            {s.customer_name || <span className="text-muted opacity-50">Walk-in</span>}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 fw-bold text-primary">
                                    <div className="d-flex flex-column">
                                        <span>{currencySymbol}{parseFloat(s.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        {s.status === 'returned' && (
                                            <span className="badge bg-danger-soft text-danger x-small border-0 mt-1" style={{ width: 'fit-content' }}>FULL RETURN</span>
                                        )}
                                        {s.status === 'partial_return' && (
                                            <span className="badge bg-warning-soft text-warning x-small border-0 mt-1" style={{ width: 'fit-content' }}>PARTIAL RETURN</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`badge-soft border-0 x-small px-3 py-1 fw-bold ${s.payment_method === 'cash' ? 'text-success bg-success-soft' : 'text-info bg-info-soft'}`}>
                                        {s.payment_method.toUpperCase()}
                                    </span>
                                </td>
                                {!isCashierLike && <td className="px-4 py-3 small opacity-75">{s.user_name}</td>}
                                <td className="px-4 py-3 text-end">
                                    <div className="d-flex justify-content-end gap-2 text-nowrap">
                                        {s.status !== 'returned' && (
                                            <button
                                                className="btn btn-sm btn-icon border border-white-10 rounded-3 hover-glass transition-all"
                                                onClick={() => handleReturn(s.id)}
                                                title="Return Items"
                                            >
                                                <i className="bi bi-arrow-return-left text-warning"></i>
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-sm btn-icon border border-white-10 rounded-3 hover-glass transition-all"
                                            onClick={() => handleViewDetail(s.id)}
                                            title="View Detail"
                                        >
                                            <i className="bi bi-eye text-primary"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
