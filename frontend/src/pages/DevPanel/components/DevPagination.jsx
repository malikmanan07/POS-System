import React from 'react';
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const DevPagination = ({ currentPage, totalPages, setCurrentPage }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="d-flex justify-content-center gap-2 mt-4">
            <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="glass pagination-btn"
                title="Previous Page"
            >
                <FiChevronLeft />
            </button>

            {[...Array(totalPages)].map((_, i) => (
                <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className="glass pagination-btn"
                    style={{
                        background: currentPage === i + 1 ? '#6366f1' : 'transparent',
                        fontWeight: '700',
                        borderColor: currentPage === i + 1 ? '#6366f1' : 'rgba(255,255,255,0.1)'
                    }}
                >
                    {i + 1}
                </button>
            ))}

            <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="glass pagination-btn"
                title="Next Page"
            >
                <FiChevronRight />
            </button>
        </div>
    );
};

export default DevPagination;
