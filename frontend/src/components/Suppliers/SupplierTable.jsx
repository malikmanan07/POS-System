import { Badge } from "react-bootstrap";

export default function SupplierTable({
    loading,
    paginatedSuppliers,
    handleViewProducts,
    handleOpenModal,
    askDelete
}) {
    return (
        <div className="table-darkx">
            <table className="table table-borderless table-hover mb-0">
                <thead>
                    <tr>
                        <th className="px-4 py-3">SUPPLIER</th>
                        <th className="px-4 py-3 text-center">CONTACT</th>
                        <th className="px-4 py-3 text-center">PRODUCTS</th>
                        <th className="px-4 py-3 text-end">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="4" className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </td>
                        </tr>
                    ) : paginatedSuppliers.length > 0 ? (
                        paginatedSuppliers.map((s) => (
                            <tr key={s.id}>
                                <td className="px-4 py-3 align-middle">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="icon-box-sm rounded-3 bg-primary-soft text-primary d-flex align-items-center justify-content-center">
                                            <i className="bi bi-person-workspace fs-5"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-white">{s.name}</div>
                                            <div className="text-muted x-small">{s.address || "No address"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-middle text-center">
                                    <div className="small text-white opacity-75">{s.phone || "---"}</div>
                                    <div className="x-small text-muted">{s.email || "---"}</div>
                                </td>
                                <td className="px-4 py-3 align-middle text-center">
                                    <Badge
                                        className={`badge-soft pointer ${s.productCount > 0 ? 'bg-info' : 'bg-secondary'}`}
                                        style={{ cursor: s.productCount > 0 ? 'pointer' : 'default' }}
                                        onClick={() => s.productCount > 0 && handleViewProducts(s)}
                                    >
                                        {s.productCount} Products
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-end align-middle">
                                    <button
                                        className="btn btn-sm btn-outline-light me-2 rounded-3 border-0"
                                        onClick={() => handleOpenModal(s)}
                                    >
                                        <i className="bi bi-pencil-square text-primary"></i>
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-light rounded-3 border-0"
                                        onClick={() => askDelete(s)}
                                    >
                                        <i className="bi bi-trash text-danger"></i>
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="text-center py-5 text-muted">No suppliers matching your search.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
