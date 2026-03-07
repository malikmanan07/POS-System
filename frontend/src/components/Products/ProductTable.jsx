import React, { useState } from "react";
import Skeleton from "../Skeleton";
import { Collapse } from "react-bootstrap";

export default function ProductTable({
    loading,
    paginatedProducts,
    products,
    handleOpenEdit,
    asyncDelete,
    askDelete,
    handleDuplicate,
    currencySymbol,
    apiBaseURL
}) {
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const renderActionButtons = (p) => (
        <div className="d-flex justify-content-end gap-1">
            <button
                className="btn btn-sm btn-outline-light rounded-3 border-0"
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }}
                title="Edit"
            >
                <i className="bi bi-pencil-square text-primary"></i>
            </button>
            <button
                className="btn btn-sm btn-outline-light rounded-3 border-0"
                onClick={(e) => { e.stopPropagation(); handleDuplicate(p); }}
                title="Duplicate"
            >
                <i className="bi bi-files text-info"></i>
            </button>
            <button
                className="btn btn-sm btn-outline-light rounded-3 border-0"
                onClick={(e) => { e.stopPropagation(); askDelete(p); }}
                title="Delete"
            >
                <i className="bi bi-trash text-danger"></i>
            </button>
        </div>
    );

    return (
        <div className="table-darkx">
            <div className="table-responsive">
                <table className="table table-borderless table-hover mb-0">
                    <thead>
                        <tr className="text-nowrap">
                            <th className="px-4 py-3" style={{ width: '50px' }}></th>
                            <th className="px-4 py-3" style={{ width: '25%' }}>PRODUCT</th>
                            <th className="px-4 py-3" style={{ width: '15%' }}>SKU</th>
                            <th className="px-4 py-3" style={{ width: '12%' }}>CATEGORY</th>
                            <th className="px-4 py-3" style={{ width: '12%' }}>PRICE</th>
                            <th className="px-4 py-3" style={{ width: '12%' }}>STOCK</th>
                            <th className="px-4 py-3" style={{ width: '10%' }}>STATUS</th>
                            <th className="px-4 py-3 text-end" style={{ width: '10%' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && paginatedProducts.length === 0 ? (
                            [...Array(8)].map((_, i) => (
                                <tr key={i} className="border-bottom border-white-5">
                                    <td className="px-4 py-3 align-middle"><Skeleton width="20px" /></td>
                                    <td className="px-4 py-3 align-middle">
                                        <div className="d-flex align-items-center gap-3">
                                            <Skeleton width="45px" height="45px" borderRadius="8px" />
                                            <Skeleton width="120px" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle"><Skeleton width="60px" /></td>
                                    <td className="px-4 py-3 align-middle"><Skeleton width="100px" /></td>
                                    <td className="px-4 py-3 align-middle"><Skeleton width="70px" /></td>
                                    <td className="px-4 py-3 align-middle"><Skeleton width="40px" /></td>
                                    <td className="px-4 py-3 align-middle"><Skeleton width="70px" /></td>
                                    <td className="px-4 py-3 text-end align-middle"><Skeleton width="60px" className="ms-auto" /></td>
                                </tr>
                            ))
                        ) : (
                            <>
                                {paginatedProducts.map(p => (
                                    <React.Fragment key={p.id}>
                                        <tr
                                            className="border-bottom border-white-5"
                                            style={{ cursor: p.variants?.length ? 'pointer' : 'default' }}
                                            onClick={() => p.variants?.length && toggleRow(p.id)}
                                        >
                                            <td className="px-4 py-3 align-middle text-center">
                                                {p.variants?.length > 0 && (
                                                    <i className={`bi bi-chevron-${expandedRows[p.id] ? 'up' : 'down'} text-muted`}></i>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className="d-flex align-items-center gap-3 text-nowrap">
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
                                                    <div>
                                                        <div className="fw-bold">{p.name}</div>
                                                        {p.variants?.length > 0 && (
                                                            <div className="x-small text-info">
                                                                {p.variants.length} {p.variant_name ? p.variant_name : 'Variant'}{p.variants.length > 1 ? 's' : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-muted text-nowrap">{p.sku || "N/A"}</td>
                                            <td className="px-4 py-3 align-middle text-nowrap">
                                                <span className="badge-soft">{p.category_name || "Uncategorized"}</span>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-nowrap">
                                                {p.variants?.length > 0 ? (
                                                    <span className="text-muted">Multiple</span>
                                                ) : (
                                                    <>{currencySymbol}{parseFloat(p.price).toFixed(2)}</>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-middle text-nowrap">
                                                {p.variants?.length > 0 ? (
                                                    <span className="badge bg-secondary">{p.stock || 0}</span>
                                                ) : (
                                                    <span className={`fw-bold ${p.stock <= (p.alert_quantity || 5) ? 'text-danger' : 'text-light'}`}>
                                                        {p.stock || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-middle text-nowrap">
                                                {p.is_active ? (
                                                    <span className="text-success small"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Active</span>
                                                ) : (
                                                    <span className="text-muted small"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-end align-middle">
                                                {renderActionButtons(p)}
                                            </td>
                                        </tr>
                                        {/* Variants Sub-Rows */}
                                        {p.variants?.length > 0 && expandedRows[p.id] && (
                                            p.variants.map((v, idx) => (
                                                <tr key={v.id} className="bg-dark-subtle border-bottom border-white-5">
                                                    <td className="ps-4 align-middle border-end border-white-5 pe-2 text-end">
                                                        <div style={{ width: '2px', height: '24px', backgroundColor: '#555', margin: '0 auto', opacity: 0.5 }}></div>
                                                    </td>
                                                    <td className="px-4 py-2 align-middle">
                                                        <div className="d-flex align-items-center gap-2 ps-4">
                                                            <i className="bi bi-arrow-return-right text-muted x-small"></i>
                                                            <div className="fw-semibold text-light x-small">
                                                                {v.variant_value || (v.name ? v.name.split(' - ').pop() : 'Variant')}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 align-middle text-muted x-small text-nowrap">{v.sku || "N/A"}</td>
                                                    <td className="px-4 py-2 align-middle text-nowrap">
                                                        <span className="badge-soft x-small" style={{ fontSize: '10px' }}>{p.category_name || "Uncategorized"}</span>
                                                    </td>
                                                    <td className="px-4 py-2 align-middle text-nowrap text-info x-small">
                                                        {currencySymbol}{parseFloat(v.price || p.price || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2 align-middle text-nowrap x-small">
                                                        <span className={`fw-bold ${parseInt(v.stock || 0) <= (v.alert_quantity || p.alert_quantity || 5) ? 'text-danger' : 'text-light'}`}>
                                                            {v.stock || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 align-middle text-nowrap x-small">
                                                        {v.is_active ? (
                                                            <span className="text-success small opacity-75">Active</span>
                                                        ) : (
                                                            <span className="text-muted small opacity-75">Inactive</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-end align-middle">
                                                        <div className="d-flex justify-content-end gap-1 scale-80">
                                                            {renderActionButtons(v)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </React.Fragment>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">No products found</td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
