import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Row, Col, Form } from "react-bootstrap";

import POSProductCard from "../components/POSProductCard";
import POSCartItem from "../components/POSCartItem";
import POSReceiptModal from "../components/POSReceiptModal";
import QuickAddCustomer from "../components/QuickAddCustomer";

export default function POS() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [lastSale, setLastSale] = useState(null);
  const { settings, currencySymbol: currency } = useSettings();
  const [posPage, setPosPage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (settings?.payment?.defaultMethod) {
      setPaymentMethod(settings.payment.defaultMethod);
    }
  }, [settings]);
  const itemsPerPage = 12;

  // Quick Customer Add
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/products?limit=all", {
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
      // Handle both direct array or paginated response
      const customerData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setCustomers(customerData);
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

  // Reset page when search term changes
  useEffect(() => {
    setPosPage(1);
  }, [searchTerm]);

  const paginatedProducts = useMemo(() => {
    const start = (posPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, posPage]);

  const totalPosPages = Math.ceil(filteredProducts.length / itemsPerPage);

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

  // Settings helpers (moved to context, but keeping aliases for POS logic)
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
        change_amount: change > 0 ? change : 0,
        payment_reference: paymentReference || null
      };

      const res = await api.post("/api/sales", saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLastSale({ ...res.data, items: cart });
      toast.success("Sale completed successfully");
      setCart([]);
      setPaidAmount("");
      setPaymentReference("");
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
                <div className="h5 mb-0 fw-bold">{filteredProducts.length}</div>
              </div>
              <div className="vr opacity-25" style={{ height: '30px' }}></div>
              <div className="text-end">
                <div className="text-muted small fw-bold">PAGE</div>
                <div className="h5 mb-0 text-primary fw-bold">{posPage}/{totalPosPages || 1}</div>
              </div>
            </div>
          </div>

          {/* Pagination Controls for Grid */}
          <div className="d-flex justify-content-between align-items-center mb-3 px-2">
            <span className="text-muted small">
              Showing {paginatedProducts.length} of {filteredProducts.length} items
            </span>
            {totalPosPages > 1 && (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-soft btn-sm px-3"
                  disabled={posPage === 1}
                  onClick={() => setPosPage(p => p - 1)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  className="btn btn-soft btn-sm px-3"
                  disabled={posPage === totalPosPages}
                  onClick={() => setPosPage(p => p + 1)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>

          {/* Product Catalog Grid */}
          <div className="flex-grow-1 overflow-auto pe-2 pos-catalog-grid">
            {paginatedProducts.length > 0 ? (
              <Row className="g-3">
                {paginatedProducts.map(p => (
                  <POSProductCard
                    key={p.id}
                    product={p}
                    currency={currency}
                    onClick={addToCart}
                    apiBaseUrl={api.defaults.baseURL}
                  />
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
                <QuickAddCustomer
                  newCustomer={newCustomer}
                  setNewCustomer={setNewCustomer}
                  handleQuickAddCustomer={handleQuickAddCustomer}
                  setShowAddCustomer={setShowAddCustomer}
                  isSavingCustomer={isSavingCustomer}
                />
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-grow-1 overflow-auto p-4 pos-cart-list">
              {cart.length > 0 ? (
                cart.map(item => (
                  <POSCartItem
                    key={item.id}
                    item={item}
                    pInfo={products.find(p => p.id === item.id)}
                    currency={currency}
                    updateQty={updateQty}
                    apiBaseUrl={api.defaults.baseURL}
                  />
                ))
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
                <div className="d-flex flex-wrap gap-2">
                  {(settings.payment?.acceptedMethods || ["Cash", "Card", "Online"])
                    .filter(m => m !== "Wallet")
                    .map(method => (
                      <button
                        key={method}
                        type="button"
                        className={`payment-btn flex-grow-1 ${paymentMethod.toLowerCase() === method.toLowerCase() ? 'active' : ''}`}
                        onClick={() => setPaymentMethod(method)}
                      >
                        {method}
                      </button>
                    ))}
                </div>
              </div>

              {/* Paid Amount Input */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <Form.Label className="text-muted small fw-bold mb-0">PAID AMOUNT</Form.Label>
                  <span
                    className="text-primary x-small fw-bold cursor-pointer opacity-75 hover-opacity-100"
                    onClick={() => setPaidAmount(total.toFixed(2))}
                  >
                    EXACT AMOUNT?
                  </span>
                </div>
                <div className="pos-amount-input-wrapper">
                  <span className="pos-currency-symbol">{currency}</span>
                  <Form.Control
                    type="number"
                    step="0.01"
                    placeholder={total.toFixed(2)}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="pos-amount-input"
                  />
                </div>
                {(settings.payment?.enableChangeCalculation && change > 0) && (
                  <div className="d-flex justify-content-between mt-2 p-2 rounded bg-success-20 border border-success-subtle">
                    <span className="small text-success fw-bold">CHANGE</span>
                    <span className="small text-success fw-bold">{currency}{change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Reference Number for Card/Online */}
              {(paymentMethod.toLowerCase() === 'card' || paymentMethod.toLowerCase() === 'online') && (
                <div className="mb-4 animate-fade-in">
                  <Form.Label className="text-muted small fw-bold">REF / TRANS ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Card Auth or Trans ID"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="bg-transparent text-white border-secondary-subtle small"
                    style={{
                      height: '38px',
                      fontSize: '0.875rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderStyle: 'dashed'
                    }}
                  />
                </div>
              )}

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

      <POSReceiptModal
        show={showReceipt}
        onHide={() => setShowReceipt(false)}
        lastSale={lastSale}
        currency={currency}
        settings={settings}
      />
    </div>
  );
}
