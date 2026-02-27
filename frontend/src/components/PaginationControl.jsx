import { Button } from "react-bootstrap";

export default function PaginationControl({ pagination, setPage }) {
    const totalPages = pagination?.pages || pagination?.totalPages || 1;
    const currentPage = pagination?.page || 1;
    const total = pagination?.total || 0;

    if (!pagination || totalPages <= 1) return null;

    return (
        <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted small">
                Showing {pagination.limit ? Math.min(pagination.limit, total - (currentPage - 1) * pagination.limit) : '...'} of {total} records
            </div>
            <div className="d-flex gap-2 align-items-center">
                <Button
                    variant="soft"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(Math.max(currentPage - 1, 1))}
                >
                    <i className="bi bi-chevron-left"></i> Previous
                </Button>
                <div className="badge-soft px-3 py-1 d-flex align-items-center rounded-3">
                    Page {currentPage} of {totalPages}
                </div>
                <Button
                    variant="soft"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
                >
                    Next <i className="bi bi-chevron-right"></i>
                </Button>
            </div>
        </div>
    );
}
