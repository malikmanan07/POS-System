export default function DiscountTable({
    paginatedItems,
    openModal,
    setConfirmDialog,
    discounts
}) {
    return (
        <div className="table-darkx shadow-soft">
            <div className="table-responsive">
                <table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr className="text-nowrap">
                            <th className="px-4 py-3">CAMPAIGN NAME</th>
                            <th className="px-4 py-3">TYPE</th>
                            <th className="px-4 py-3">VALUE</th>
                            <th className="px-4 py-3">VALIDITY</th>
                            <th className="px-4 py-3">STATUS</th>
                            <th className="px-4 py-3 text-end">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.map(d => (
                            <tr key={d.id} className="border-bottom border-white-5">
                                <td className="px-4 py-3 align-middle fw-bold text-nowrap">{d.name}</td>
                                <td className="px-4 py-3 align-middle text-nowrap">
                                    <span className="badge-soft text-uppercase x-small">{d.type}</span>
                                </td>
                                <td className="px-4 py-3 align-middle fw-bold text-primary text-nowrap">
                                    {d.type === 'percentage' ? `${parseFloat(d.value).toFixed(2)}%` : `Flat Rs.${parseFloat(d.value).toFixed(2)}`}
                                </td>
                                <td className="px-4 py-3 align-middle text-nowrap">
                                    <div className="small">
                                        {d.startDate ? new Date(d.startDate).toLocaleDateString() : 'Start Now'}
                                        <i className="bi bi-arrow-right mx-2 text-muted"></i>
                                        {d.endDate ? new Date(d.endDate).toLocaleDateString() : 'Forever'}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-middle text-nowrap">
                                    {d.isActive ? (
                                        <span className="text-success small"><i className="bi bi-circle-fill me-2" style={{ fontSize: '8px' }}></i>Active</span>
                                    ) : (
                                        <span className="text-danger small"><i className="bi bi-circle-fill me-2" style={{ fontSize: '8px' }}></i>Paused</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-end align-middle">
                                    <div className="d-flex justify-content-end gap-1">
                                        <button
                                            className="btn btn-sm btn-outline-light rounded-3 border-0"
                                            onClick={() => openModal(d)}
                                        >
                                            <i className="bi bi-pencil-square text-primary"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-light rounded-3 border-0"
                                            onClick={() => setConfirmDialog({ show: true, id: d.id, name: d.name })}
                                        >
                                            <i className="bi bi-trash text-danger"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {discounts.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">No campaigns found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
