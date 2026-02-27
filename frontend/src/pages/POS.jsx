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

  // Quick Customer Add
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

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

  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) return toast.error("Customer name is required");

    setIsSavingCustomer(true);
    try {
      const res = await api.post("/api/customers", newCustomer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Customer added successfully");
      await fetchCustomers(); // Refresh list
      setSelectedCustomer(res.data.id); // Select the newly created customer
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "", email: "", address: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Error adding customer");
    } finally {
      setIsSavingCustomer(false);
    }
  };


  return (
    <div className="p-3 h-100 pos-container">
      <Row className="h-100 g-3">
        {/* Left Side: Product Discovery */}
        <Col lg={8} xl={8} className="d-flex flex-column h-100">
          {/* Top Bar: Search and Stats */}
          <div className="glass p-4 mb-3 d-flex flex-column flex-md-row gap-3 align-items-center justify-content-between shadow-soft border-0">
            <div className="d-flex align-items-center gap-3 w-100" style={{ maxWidth: '400px' }}>
              <div className="search-icon-wrapper">
                <i className="bi bi-search text-primary fs-5"></i>
              </div>
              <Form.Control
                type="text"
                placeholder="Search products..."
                className="pos-search-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="d-none d-md-flex align-items-center gap-3">
              <div className="text-end">
                <div className="text-muted small fw-bold">TOTAL</div>
                <div className="h5 mb-0 fw-bold">{products.length}</div>
              </div>
              <div className="vr opacity-25" style={{ height: '30px' }}></div>
              <div className="text-end">
                <div className="text-muted small fw-bold">CART</div>
                <div className="h5 mb-0 text-primary fw-bold">{cart.length}</div>
              </div>
            </div>
          </div>

          {/* Product Catalog Grid */}
          <div className="flex-grow-1 overflow-auto pe-2 pos-catalog-grid">
            {filteredProducts.length > 0 ? (
              <Row className="g-3">
                {filteredProducts.map(p => (
                  <Col key={p.id} sm={6} md={4} xl={3}>
                    <Card
                      className="pos-product-card border-0"
                      onClick={() => addToCart(p)}
                    >
                      <div className="pos-card-img-wrapper">
                        {p.image ? (
                          <img
                            src={`${api.defaults.baseURL}${p.image}`}
                            alt={p.name}
                            className="pos-card-img"
                          />
                        ) : (
                          <div className="pos-card-placeholder">
                            <span>{p.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="pos-stock-badge">
                          <span className={`badge ${p.stock < 10 ? 'bg-danger' : 'bg-success'}`}>
                            {p.stock}
                          </span>
                        </div>
                      </div>
                      <Card.Body className="p-3">
                        <div className="small text-muted mb-1 text-uppercase ls-1">{p.category_name || "General"}</div>
                        <div className="fw-bold text-white fs-6 mb-2 text-truncate">{p.name}</div>
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-10">
                          <span className="h5 mb-0 text-primary fw-bold">{currency}{parseFloat(p.price).toFixed(2)}</span>
                          <button className="btn btn-sm btn-icon-plus">
                            <i className="bi bi-plus-lg"></i>
                          </button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 glass">
                <i className="bi bi-box-seam text-muted mb-3" style={{ fontSize: '4rem' }}></i>
                <h4 className="text-muted">No products found</h4>
              </div>
            )}
          </div>
        </Col>

        {/* Right Side: Order Summary & Checkout */}
        <Col lg={4} xl={4} className="h-100">
          <div className="glass h-100 d-flex flex-column p-0 overflow-hidden shadow-soft border-0">
            {/* Cart Header */}
            <div className="p-4 border-bottom border-secondary-subtle">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0">Current Order</h4>
                <button className="btn btn-sm btn-outline-danger border-0" onClick={() => setCart([])}>
                  <i className="bi bi-trash3 me-1"></i>
                </button>
              </div>

              {!showAddCustomer ? (
                <div className="d-flex gap-2">
                  <div className="customer-select-wrapper flex-grow-1">
                    <i className="bi bi-person-circle text-muted"></i>
                    <Form.Select
                      value={selectedCustomer}
                      onChange={e => setSelectedCustomer(e.target.value)}
                      className="pos-customer-select"
                    >
                      <option value="">Walk-in Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                  </div>
                  <button
                    className="btn btn-soft px-3"
                    title="Add New Customer"
                    onClick={() => setShowAddCustomer(true)}
                  >
                    <i className="bi bi-person-plus-fill"></i>
                  </button>
                </div>
              ) : (
                <div className="quick-add-customer p-3 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-25">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold text-primary">NEW CUSTOMER</span>
                    <button className="btn-close btn-close-white small" style={{ fontSize: '0.6rem' }} onClick={() => setShowAddCustomer(false)}></button>
                  </div>
                  <Form onSubmit={handleQuickAddCustomer}>
                    <Form.Control
                      size="sm"
                      placeholder="Name *"
                      className="bg-dark border-secondary text-white mb-2"
                      value={newCustomer.name}
                      onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      required
                    />
                    <Form.Control
                      size="sm"
                      placeholder="Phone"
                      className="bg-dark border-secondary text-white mb-2 shadow-none"
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                    <Form.Control
                      size="sm"
                      type="email"
                      placeholder="Email"
                      className="bg-dark border-secondary text-white mb-2 shadow-none"
                      value={newCustomer.email}
                      onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    />
                    <Form.Control
                      size="sm"
                      as="textarea"
                      rows={2}
                      placeholder="Address"
                      className="bg-dark border-secondary text-white mb-2 shadow-none"
                      value={newCustomer.address}
                      onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    />
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="primary" type="submit" className="w-100" disabled={isSavingCustomer}>
                        {isSavingCustomer ? "Saving..." : "Save Customer"}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-grow-1 overflow-auto p-4 pos-cart-list">
              {cart.length > 0 ? (
                cart.map(item => {
                  const pInfo = products.find(p => p.id === item.id);
                  return (
                    <div key={item.id} className="pos-cart-item mb-4">
                      <div className="pos-cart-thumb">
                        {pInfo?.image ? (
                          <img src={`${api.defaults.baseURL}${pInfo.image}`} alt="" />
                        ) : (
                          <div className="thumb-placeholder">{item.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-grow-1 min-w-0 mx-2">
                        <div className="fw-bold text-white text-truncate small">{item.name}</div>
                        <div className="text-primary small fw-bold">
                          {currency}{item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 px-1">
                        <button className="btn-qty" onClick={() => updateQty(item.id, -1)}>-</button>
                        <span className="fw-bold text-white small" style={{ minWidth: '15px', textAlign: 'center' }}>{item.qty}</span>
                        <button className="btn-qty" onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                      <div className="text-end" style={{ minWidth: '60px' }}>
                        <div className="fw-bold text-white small">{currency}{item.line_total.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center opacity-50">
                  <i className="bi bi-cart-x mb-3" style={{ fontSize: '3rem' }}></i>
                  <div className="fs-6">Cart is empty</div>
                </div>
              )}
            </div>

            {/* Billing Summary */}
            <div className="p-4 bg-black-25 border-top border-secondary-subtle">
              <div className="billing-rows mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Subtotal</span>
                  <span className="text-white fw-bold small">{currency}{cartSubtotal.toFixed(2)}</span>
                </div>
                {settings.tax?.enableTax && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">{taxName} ({taxRate}%)</span>
                    <span className="text-white fw-bold small">{currency}{tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mt-3 pt-3 border-top border-secondary-subtle">
                  <span className="h5 mb-0 fw-bold">TOTAL</span>
                  <span className="h5 mb-0 fw-bold text-primary">{currency}{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-4">
                <div className="d-flex gap-2">
                  <button
                    className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    Cash
                  </button>
                  <button
                    className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    Card
                  </button>
                </div>
              </div>

              {/* Paid Amount Input */}
              <div className="mb-4">
                <div className="pos-amount-input-wrapper">
                  <span className="currency-label">{currency}</span>
                  <input
                    type="number"
                    placeholder={total.toFixed(2)}
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    className="pos-amount-input"
                  />
                </div>
                {change > 0 && (
                  <div className="d-flex justify-content-between mt-2 p-2 rounded bg-success-20 border border-success-subtle">
                    <span className="small text-success fw-bold">CHANGE</span>
                    <span className="small text-success fw-bold">{currency}{change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Checkout Action */}
              <button
                className="btn btn-checkout w-100"
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                <span>CHECKOUT</span>
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Modern Receipt Modal */}
      <Modal show={showReceipt} onHide={() => setShowReceipt(false)} centered contentClassName="glass border-0 receipt-modal">
        <Modal.Body className="p-0 text-center">
          <div className="p-5">
            <div className="receipt-success-icon mb-4">
              <i className="bi bi-check2"></i>
            </div>
            <h2 className="fw-bold text-white mb-2">Success!</h2>
            <p className="text-muted">ID: #{lastSale?.id}</p>
          </div>

          <div className="p-4 mx-4 mb-4 rounded-4 bg-dark bg-opacity-50 text-start">
            <div className="receipt-items mb-3">
              {lastSale?.items.map((item, i) => (
                <div key={i} className="d-flex justify-content-between mb-2 small">
                  <span className="text-white-50">{item.qty}x {item.name}</span>
                  <span className="text-white">{currency}{parseFloat(item.line_total).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between pt-3 border-top border-secondary border-opacity-50 h4 fw-bold text-white mt-2 mb-0">
              <span className="text-primary">TOTAL</span>
              <span className="text-primary">{currency}{parseFloat(lastSale?.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="p-4 d-flex gap-3">
            <Button variant="soft" className="w-100 py-3 border-0" onClick={() => setShowReceipt(false)}>Close</Button>
            <Button className="btn-gradient w-100 py-3 border-0" onClick={() => window.print()}>Print</Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
