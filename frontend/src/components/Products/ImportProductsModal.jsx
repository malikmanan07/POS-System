import { useState, useRef } from "react";
import { Modal, Button, Table, Alert, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import Papa from "papaparse";
import { importProductsBulk } from "../../api/productApi";
import { api } from "../../api/client";

export default function ImportProductsModal({ show, onHide, onSuccess, token }) {
    const [previewData, setPreviewData] = useState([]);
    const [fileName, setFileName] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [summary, setSummary] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Map CSV headers to our format
                const mapped = results.data.map(row => ({
                    name: row.name || row.Name || "",
                    sku: row.sku || row.SKU || row.barcode || row.Barcode || "",
                    category_name: row.category || row.Category || "",
                    cost_price: row.cost_price || row.CostPrice || row["Cost Price"] || 0,
                    price: row.price || row.Price || 0,
                    stock: row.stock || row.Stock || row.qty || row.Qty || 0,
                    alert_quantity: row.alert_quantity || row.alert || 5,
                    supplier_name: row.supplier || row.Supplier || ""
                }));
                setPreviewData(mapped);
                setSummary(null);
            },
            error: (err) => {
                toast.error("Error parsing CSV: " + err.message);
            }
        });
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;
        setIsImporting(true);
        try {
            const res = await importProductsBulk(previewData, token);
            setSummary(res.data.summary);
            if (res.data.summary.success > 0) {
                toast.success(`Imported ${res.data.summary.success} products!`);
                onSuccess();
            }
            if (res.data.summary.skipped > 0) {
                toast.warning(`${res.data.summary.skipped} items skipped. Check logs.`);
                console.warn("Import Errors:", res.data.errors);
            }
            setPreviewData([]);
            setFileName("");
        } catch (err) {
            toast.error(err.response?.data?.error || "Import failed");
        } finally {
            setIsImporting(false);
        }
    };

    const downloadSample = () => {
        const csvContent = "name,sku,category,cost_price,price,stock,alert_quantity,supplier\n" +
            "iPhone 15 Pro,IPH15P,Mobiles,250000,285000,10,2,Apple Inc\n" +
            "Samsung S24,SAMS24,Mobiles,210000,240000,15,5,Samsung Official";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "products_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered contentClassName="glass border-0">
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary">
                <Modal.Title className="fw-bold">Bulk Import Products</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <Button variant="outline-primary" size="sm" className="rounded-pill" onClick={downloadSample}>
                            <i className="bi bi-download me-2"></i> Download Sample CSV
                        </Button>
                    </div>
                    <div>
                        <input
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Button variant="primary" className="rounded-pill px-4" onClick={() => fileInputRef.current.click()}>
                            <i className="bi bi-file-earmark-arrow-up me-2"></i>
                            {fileName ? "Change File" : "Select CSV File"}
                        </Button>
                        {fileName && <span className="ms-3 text-muted small">{fileName}</span>}
                    </div>
                </div>

                {summary && (
                    <Alert variant={summary.skipped > 0 ? "warning" : "success"} className="glass border-0 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-1">Import Summary</h5>
                                <p className="mb-0">
                                    Total Rows: <strong>{summary.total}</strong> |
                                    Success: <strong className="text-success">{summary.success}</strong> |
                                    Skipped: <strong className="text-danger">{summary.skipped}</strong>
                                </p>
                            </div>
                            <Button variant="outline-secondary" size="sm" onClick={() => setSummary(null)}>Dismiss</Button>
                        </div>
                    </Alert>
                )}

                {previewData.length > 0 && (
                    <div className="preview-container glass p-3 border-white-10">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="text-white mb-0">Preview ({previewData.length} items)</h6>
                            <Button variant="success" className="rounded-pill px-4" onClick={handleImport} disabled={isImporting}>
                                {isImporting ? <Spinner size="sm" /> : "Confirm & Import All"}
                            </Button>
                        </div>
                        <div className="table-responsive" style={{ maxHeight: '400px' }}>
                            <Table hover className="text-white align-middle mb-0">
                                <thead>
                                    <tr className="border-bottom border-white-10">
                                        <th className="x-small fw-bold py-3">NAME</th>
                                        <th className="x-small fw-bold py-3">SKU</th>
                                        <th className="x-small fw-bold py-3">CATEGORY</th>
                                        <th className="x-small fw-bold py-3 text-end">COST</th>
                                        <th className="x-small fw-bold py-3 text-end">PRICE</th>
                                        <th className="x-small fw-bold py-3 text-center">STOCK</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((p, i) => (
                                        <tr key={i} className="border-bottom border-white-10 border-opacity-10">
                                            <td className="small">{p.name || <span className="text-danger">Missing</span>}</td>
                                            <td className="small">{p.sku || "-"}</td>
                                            <td className="small text-muted">{p.category_name || "-"}</td>
                                            <td className="small text-end">{p.cost_price}</td>
                                            <td className="small text-end">{p.price}</td>
                                            <td className="small text-center"><span className="badge bg-success-soft text-success">{p.stock}</span></td>
                                        </tr>
                                    ))}
                                    {previewData.length > 50 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-3 text-muted italic">
                                                ... and {previewData.length - 50} more items
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}

                {!fileName && !summary && (
                    <div className="text-center py-5 glass border-dashed">
                        <i className="bi bi-file-earmark-spreadsheet fs-1 text-muted mb-3 d-block"></i>
                        <h5 className="text-white">No file selected</h5>
                        <p className="text-muted small">Upload a CSV file to see a preview and import items in bulk.</p>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}
