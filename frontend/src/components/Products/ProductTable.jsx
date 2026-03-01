export default function ProductTable({
    loading,
    paginatedProducts,
    products,
    handleOpenEdit,
    askDelete,
    currencySymbol,
    apiBaseURL
}) {
    return (
        <div className="table-darkx">
            <table className="table table-borderless table-hover mb-0">
                <thead>
                    <tr>
                        <th className="px-4 py-3">PRODUCT</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">CATEGORY</th>
                        <th className="px-4 py-3">PRICE</th>
                        <th className="px-4 py-3">STOCK</th>
                        <th className="px-4 py-3">STATUS</th>
                        <th className="px-4 py-3 text-end">ACTIONS</th>
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
                    ) : (
                        <>
                            {paginatedProducts.map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-3 align-middle">
                                        <div className="d-flex align-items-center gap-3">
                                            <div
                                                className="rounded-3 bg-dark border border-secondary"
                                                style={{ width: '45px', height: '45px', overflow: 'hidden', flexShrink: 0 }}
                                            >
                                                {p.image ? (
                                                    <img
                                                        src={`${apiBaseURL}${p.image}`}
                                                        alt={p.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                                        <i className="bi bi-image" style={{ fontSize: '1.2rem' }}></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="fw-bold">{p.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-muted">{p.sku || "N/A"}</td>
                                    <td className="px-4 py-3 align-middle">
                                        <span className="badge-soft">{p.category_name || "Uncategorized"}</span>
                                    </td>
                                    <td className="px-4 py-3 align-middle">{currencySymbol}{parseFloat(p.price).toFixed(2)}</td>
                                    <td className="px-4 py-3 align-middle">
                                        <span className={`fw-bold ${p.stock <= (p.alert_quantity || 5) ? 'text-danger' : ''}`}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        {p.is_active ? (
                                            <span className="text-success small"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Active</span>
                                        ) : (
                                            <span className="text-muted small"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Inactive</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-end align-middle">
                                        <button
                                            className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                                            onClick={() => handleOpenEdit(p)}
                                        >
                                            <i className="bi bi-pencil-square text-primary"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-light rounded-3 border-0"
                                            onClick={() => askDelete(p)}
                                        >
                                            <i className="bi bi-trash text-danger"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-muted">No products found</td>
                                </tr>
                            )}
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
}
