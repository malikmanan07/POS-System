import { Table } from "react-bootstrap";

export default function ShiftTable({ loading, shifts, currencySymbol, isAdmin }) {
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!shifts || shifts.length === 0) {
        return (
            <div className="text-center py-5 text-muted opacity-50 italic">
                <i className="bi bi-calendar-x h1 d-block mb-3"></i>
                No shift history found
            </div>
        );
    }

    return (
        <div className="table-darkx border-0 overflow-hidden">
            <div className="table-responsive">
                <table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr className="border-bottom border-white-10">
                            <th className="px-4 py-3 x-small fw-bold">ID</th>
                            {isAdmin && <th className="px-4 py-3 x-small fw-bold">USER</th>}
                            <th className="px-4 py-3 x-small fw-bold text-nowrap">START TIME</th>
                            <th className="px-4 py-3 x-small fw-bold text-nowrap">END TIME</th>
                            <th className="px-4 py-3 x-small fw-bold">OPENING</th>
                            <th className="px-4 py-3 x-small fw-bold">CLOSING</th>
                            <th className="px-4 py-3 x-small fw-bold">SALES</th>
                            <th className="px-4 py-3 x-small fw-bold">EXPECTED</th>
                            <th className="px-4 py-3 x-small fw-bold">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.map((shift) => (
                            <tr key={shift.id} className="align-middle border-bottom border-white-5">
                                <td className="px-4 py-3">
                                    <span className="badge bg-secondary bg-opacity-10 text-muted border border-white-10 rounded-pill px-3 py-1">#{shift.id}</span>
                                </td>
                                {isAdmin && (
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary" style={{ width: '30px', height: '30px', fontSize: '12px' }}>
                                                {shift.userName?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="fw-medium small text-nowrap">{shift.userName}</span>
                                        </div>
                                    </td>
                                )}
                                <td className="px-4 py-3 small text-nowrap">
                                    {new Date(shift.startTime).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 small opacity-75 text-nowrap">
                                    {shift.endTime ? new Date(shift.endTime).toLocaleString() : '-'}
                                </td>
                                <td className="px-4 py-3 fw-bold text-nowrap">{currencySymbol}{parseFloat(shift.openingBalance).toFixed(2)}</td>
                                <td className="px-4 py-3 text-nowrap">
                                    {shift.closingBalance ? (
                                        <span className="fw-bold text-info">{currencySymbol}{parseFloat(shift.closingBalance).toFixed(2)}</span>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-success fw-bold text-nowrap">
                                    {currencySymbol}{parseFloat(shift.totalSales || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 fw-bold text-primary text-nowrap">
                                    {currencySymbol}{parseFloat(shift.expectedCash || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`badge-soft border-0 x-small px-3 py-1 fw-bold ${shift.status === 'active' ? 'bg-success-soft' : 'bg-secondary-soft'}`}>
                                        {shift.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
