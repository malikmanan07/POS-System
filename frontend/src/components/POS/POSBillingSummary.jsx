import { Form, Badge, Button, Row, Col } from "react-bootstrap";

export default function POSBillingSummary({
    cart,
    applicableDiscounts,
    selectedDiscountId,
    onSelectDiscount,
    currency,
    subtotal,
    discountAmount,
    tax,
    taxRate,
    taxName,
    total,
    change,
    paymentMethod,
    setPaymentMethod,
    paymentReference,
    setPaymentReference,
    paidAmount,
    setPaidAmount,
    onCheckout
}) {
    return (
        <div className="p-4 bg-black-25 border-top border-secondary-subtle">
            <div className="billing-rows mb-4">
                {applicableDiscounts.length > 0 && (
                    <div className="mb-3 animate-fade-in">
                        <Form.Label className="text-muted x-small fw-bold mb-1 d-flex justify-content-between">
                            <span>APPLY DISCOUNT / PROMO</span>
                            <Badge bg="success" className="x-small">Applied Automatically</Badge>
                        </Form.Label>
                        <Form.Select
                            size="sm"
                            className="bg-dark text-white border-primary-soft small shadow-none"
                            value={selectedDiscountId}
                            onChange={(e) => onSelectDiscount(e.target.value)}
                        >
                            <option value="">No Discount</option>
                            {applicableDiscounts.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.name} ({d.type === 'percentage' ? `${parseFloat(d.value)}%` : `Rs.${parseFloat(d.value)}`})
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                )}

                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Subtotal</span>
                    <span className="text-white fw-bold small">{currency}{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-success small">Discount</span>
                        <span className="text-success fw-bold small">-{currency}{discountAmount.toFixed(2)}</span>
                    </div>
                )}

                {taxRate > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">{taxName} ({taxRate}%)</span>
                        <span className="text-white fw-bold small">{currency}{tax.toFixed(2)}</span>
                    </div>
                )}

                <div className="d-flex justify-content-between mt-3 pt-3 border-top border-secondary-subtle">
                    <span className="text-white fw-bold">Grand Total</span>
                    <span className="text-primary h4 mb-0 fw-bold">{currency}{total.toFixed(2)}</span>
                </div>
            </div>

            <div className="payment-section">
                <Row className="g-2 mb-3">
                    <Col xs={6}>
                        <Form.Select
                            size="sm"
                            className="bg-dark text-white border-secondary-subtle small shadow-none h-100"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Online">Online</option>
                        </Form.Select>
                    </Col>
                    <Col xs={6}>
                        <Form.Control
                            size="sm"
                            type="number"
                            placeholder="Amount Paid"
                            className="bg-dark text-white border-secondary-subtle small shadow-none h-100"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onCheckout()}
                        />
                    </Col>
                </Row>

                {(paymentMethod.toLowerCase() === 'card' || paymentMethod.toLowerCase() === 'online') && (
                    <div className="mb-3">
                        <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Reference / Transaction ID"
                            className="bg-dark text-white border-primary-soft small shadow-none"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onCheckout()}
                        />
                    </div>
                )}

                {paidAmount && change > 0 && (
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-success-soft rounded">
                        <span className="text-success small fw-bold">Change Amount</span>
                        <span className="text-success fw-bold">{currency}{change.toFixed(2)}</span>
                    </div>
                )}

                <Button
                    variant="primary"
                    className="w-100 py-3 fw-bold shadow-lg border-0 btn-checkout"
                    onClick={onCheckout}
                >
                    COMPLETE TRANSACTION
                </Button>
            </div>
        </div>
    );
}
