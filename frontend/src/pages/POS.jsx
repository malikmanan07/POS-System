import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Row, Col, Form, Button, Card, Modal } from "react-bootstrap";

export default function POS() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [settings, setSettings] = useState({
    business: { currency: "USD" },
    tax: { taxRate: 0, enableTax: false, taxName: "Tax" }
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error("Failed to load settings in POS");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.filter(p => p.is_active));
    } catch (err) {
      toast.error("Error loading products");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/api/customers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data);
    } catch (err) {
      toast.error("Error loading customers");
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const addToCart = (product) => {
    if (product.stock <= 0) return toast.error("Product out of stock");

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error("Cannot exceed available stock");
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1, line_total: (item.qty + 1) * item.price } : item
        );
      }
      return [...prev, {
        product_id: product.id,
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        qty: 1,
        line_total: parseFloat(product.price)
      }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        // check stock
        const product = products.find(p => p.id === id);
        if (delta > 0 && newQty > product.stock) {
          toast.error("Stock limit reached");
          return item;
        }
        return { ...item, qty: newQty, line_total: newQty * item.price };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  // Settings helpers
  const currency = settings.business?.currency === 'PKR' ? 'Rs' :
    settings.business?.currency === 'EUR' ? '€' :
      settings.business?.currency === 'GBP' ? '£' : '$';
  const taxRate = settings.tax?.enableTax ? (parseFloat(settings.tax.taxRate) || 0) : 0;
  const taxName = settings.tax?.taxName || "Tax";

  const cartSubtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
  const tax = cartSubtotal * (taxRate / 100);
  const total = cartSubtotal + tax;
  const change = paidAmount ? parseFloat(paidAmount) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (paidAmount && parseFloat(paidAmount) < total) return toast.error("Insufficient payment");

    try {
      const saleData = {
        customer_id: selectedCustomer || null,
        items: cart,
        subtotal: cartSubtotal,
        discount: 0,
        tax: tax,
        total: total,
        payment_method: paymentMethod,
        paid_amount: paidAmount || total,
        change_amount: change > 0 ? change : 0
      };

      const res = await api.post("/api/sales", saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLastSale({ ...res.data, items: cart });
      toast.success("Sale completed successfully");
      setCart([]);
      setPaidAmount("");
      setSelectedCustomer("");
      setShowReceipt(true);
      fetchProducts(); // Refresh stock
    } catch (err) {
      toast.error(err.response?.data?.error || "Checkout failed");
    }
  };


  return (
    <div className="p-3 h-100">
      <Row className="h-100">
        {/* Product Selection */}
        <Col md={8} className="d-flex flex-column">
          <div className="glass p-3 mb-3 d-flex gap-3 align-items-center">
            <i className="bi bi-search text-muted h4 mb-0"></i>
            <Form.Control
              type="text"
              placeholder="Search product by name or SKU..."
              className="bg-transparent border-0 text-white shadow-none fs-5"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-grow-1 overflow-auto pe-2" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            <Row className="g-3">
              {filteredProducts.map(p => (
                <Col key={p.id} sm={6} lg={4} xl={3}>
                  <Card
                    className="glass border-0 h-100 cursor-pointer product-card"
                    onClick={() => addToCart(p)}
                  >
                    <Card.Body className="d-flex flex-column text-center p-3">
                      <div className="brand-badge mx-auto mb-2" style={{ scale: '1.2' }}>
                        {p.name.charAt(0)}
                      </div>
                      <div className="fw-bold text-truncate">{p.name}</div>
                      <div className="small text-muted mb-2">{p.category_name || "General"}</div>
                      <div className="mt-auto d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-primary fs-5">{currency}{parseFloat(p.price).toFixed(2)}</span>
                        <span className={`small ${p.stock < 10 ? 'text-danger' : 'text-muted'}`}>Stock: {p.stock}</span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Col>

        {/* Cart & Checkout */}
        <Col md={4}>
          <div className="glass h-100 d-flex flex-column p-4 overflow-hidden">
            <div className="mb-4">
              <h4 className="fw-bold mb-3">Current Order</h4>
              <Form.Select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="bg-dark text-light border-secondary shadow-none mb-3"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </div>

            <div className="flex-grow-1 overflow-auto mb-4 cart-items">
              {cart.map(item => (
                <div key={item.id} className="d-flex align-items-center gap-2 mb-3 border-bottom border-secondary pb-3">
                  <div className="flex-grow-1">
                    <div className="fw-bold small">{item.name}</div>
                    <div className="small text-muted">{currency}{item.price.toFixed(2)} x {item.qty}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-soft p-1" onClick={() => updateQty(item.id, -1)}>-</button>
                    <span className="fw-bold px-1">{item.qty}</span>
                    <button className="btn btn-sm btn-soft p-1" onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  <div className="fw-bold ms-2">{currency}{item.line_total.toFixed(2)}</div>
                </div>
              ))}
              {cart.length === 0 && <div className="text-center py-5 text-muted">Order is empty</div>}
            </div>

            <div className="mt-auto border-top border-secondary pt-3">
              <div className="d-flex justify-content-between mb-1 text-muted small">
                <span>Subtotal</span>
                <span>{currency}{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 text-muted small">
                <span>{taxName} ({taxRate}%)</span>
                <span>{currency}{tax.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-4 h4 fw-bold text-white">
                <span>Total</span>
                <span>{currency}{total.toFixed(2)}</span>
              </div>


              <div className="mb-3">
                <Form.Label className="small text-muted fw-bold">PAYMENT METHOD</Form.Label>
                <div className="d-flex gap-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'primary' : 'outline-secondary'}
                    className="w-100 border-0"
                    onClick={() => setPaymentMethod('cash')}
                  >Cash</Button>
                  <Button
                    variant={paymentMethod === 'card' ? 'primary' : 'outline-secondary'}
                    className="w-100 border-0"
                    onClick={() => setPaymentMethod('card')}
                  >Card</Button>
                </div>
              </div>

              <Form.Group className="mb-4">
                <Form.Label className="small text-muted fw-bold">PAID AMOUNT</Form.Label>
                <Form.Control
                  type="number"
                  placeholder={`${currency}${total.toFixed(2)}`}
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  className="bg-dark text-light border-secondary shadow-none fw-bold text-center fs-4 py-2"
                />
                {change > 0 && <div className="text-success text-center mt-2 fw-bold">Change: {currency}{change.toFixed(2)}</div>}

              </Form.Group>

              <button
                className="btn btn-gradient w-100 py-3 fw-bold fs-5"
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                COMPLETE CHECKOUT
              </button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Receipt Modal */}
      <Modal show={showReceipt} onHide={() => setShowReceipt(false)} centered contentClassName="glass border-0">
        <Modal.Header closeButton closeVariant="white" className="border-0 pb-0"></Modal.Header>
        <Modal.Body className="p-5 text-center">
          <div className="mb-4">
            <div className="bg-success rounded-circle d-inline-flex p-3 mb-3">
              <i className="bi bi-check-lg text-white h1 mb-0"></i>
            </div>
            <h2 className="fw-bold">Payment Success!</h2>
            <p className="text-muted">Sale ID: #{lastSale?.id}</p>
          </div>

          <div className="border-top border-bottom border-secondary py-3 mb-4 text-start">
            {lastSale?.items.map((item, i) => (
              <div key={i} className="d-flex justify-content-between small mb-2">
                <span>{item.qty}x {item.name}</span>
                <span>{currency}{item.line_total.toFixed(2)}</span>
              </div>
            ))}
            <div className="d-flex justify-content-between fw-bold mt-3 fs-5">
              <span>TOTAL PAID</span>
              <span>{currency}{parseFloat(lastSale?.total || 0).toFixed(2)}</span>
            </div>

          </div>

          <Button variant="outline-light" className="w-100 py-2 border-0 btn-soft" onClick={() => setShowReceipt(false)}>
            Close
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
}