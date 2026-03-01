import React from "react";
import { Card, Form, Row, Col, Button, Spinner } from "react-bootstrap";

/**
 * Common date range filter for reports and dashboards.
 */
const ReportFilter = ({ filters, onChange, onApply, loading }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onApply();
    };

    return (
        <Card className="glass shadow-soft border-0 mb-4 p-3 no-print">
            <Form onSubmit={handleSubmit}>
                <Row className="g-3 align-items-end">
                    <Col md={4} sm={6}>
                        <Form.Label className="text-muted small mb-1">From Date</Form.Label>
                        <Form.Control
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={(e) => onChange("startDate", e.target.value)}
                            className="bg-dark text-white border-secondary shadow-none"
                        />
                    </Col>
                    <Col md={4} sm={6}>
                        <Form.Label className="text-muted small mb-1">To Date</Form.Label>
                        <Form.Control
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={(e) => onChange("endDate", e.target.value)}
                            className="bg-dark text-white border-secondary shadow-none"
                        />
                    </Col>
                    <Col md={4} sm={12}>
                        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                            {loading ? (
                                <Spinner size="sm" />
                            ) : (
                                <>
                                    <i className="bi bi-filter me-2"></i>Apply Filters
                                </>
                            )}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default ReportFilter;
