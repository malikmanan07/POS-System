import { Form } from "react-bootstrap";

export default function POSHeader({ searchTerm, setSearchTerm, totalProducts, currentPage, totalPages, onSearchEnter, viewMode, onViewModeChange }) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            onSearchEnter();
        }
    };

    return (
        <div className="glass p-4 mb-3 d-flex flex-column flex-md-row gap-3 align-items-center justify-content-between shadow-soft border-0">
            <div className="d-flex align-items-center gap-3 w-100" style={{ maxWidth: '400px' }}>
                <div className="search-icon-wrapper"><i className="bi bi-search text-primary fs-5"></i></div>
                <Form.Control
                    type="text"
                    placeholder="Search products..."
                    className="pos-search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            </div>
            <div className="d-flex align-items-center gap-3">
                {/* View Mode Toggle */}
                <div className="pos-view-toggle">
                    <button
                        className={`pos-view-toggle-btn ${viewMode === 'classic' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('classic')}
                        title="Classic Grid View"
                    >
                        <i className="bi bi-grid-3x3-gap-fill"></i>
                        <span>Classic</span>
                    </button>
                    <button
                        className={`pos-view-toggle-btn ${viewMode === 'touch' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('touch')}
                        title="Touch List View"
                    >
                        <i className="bi bi-list-ul"></i>
                        <span>Touch</span>
                    </button>
                </div>
                <div className="d-none d-md-flex align-items-center gap-3 text-end">
                    <div>
                        <div className="text-muted x-small fw-bold">TOTAL</div>
                        <div className="h5 mb-0 fw-bold">{totalProducts}</div>
                    </div>
                    <div className="vr opacity-25" style={{ height: '30px' }}></div>
                    <div>
                        <div className="text-muted x-small fw-bold">PAGE</div>
                        <div className="h5 mb-0 text-primary fw-bold">{currentPage}/{totalPages || 1}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
