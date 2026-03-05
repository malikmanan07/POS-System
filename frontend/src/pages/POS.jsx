import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts as getProducts, fetchCategoriesFlat } from "../api/productApi";
import { fetchCustomersList, createCustomer } from "../api/customerSupplierApi";
import { fetchDiscountsList } from "../api/discountApi";
import { createSale } from "../api/saleApi";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Row, Col, Form, Button } from "react-bootstrap";
import Skeleton from "../components/Skeleton";

// Components
import POSProductCard from "../components/POSProductCard";
import POSReceiptModal from "../components/POSReceiptModal";
import POSCategoryFilter from "../components/POS/POSCategoryFilter";
import POSCustomerSearch from "../components/POS/POSCustomerSearch";
import POSCartList from "../components/POS/POSCartList";
import POSBillingSummary from "../components/POS/POSBillingSummary";
import POSHeader from "../components/POS/POSHeader";
import POSProductGrid from "../components/POS/POSProductGrid";
import POSShiftOverlay from "../components/POS/POSShiftOverlay";
import ShiftModal from "../components/Shifts/ShiftModal";
import { useShift } from "../context/ShiftContext";

// Styles
import "../styles/POS.css";

export default function POS() {
  const { token, hasPermission, user } = useAuth();
  const { settings, currencySymbol: currency } = useSettings();
  const { activeShift, loading: shiftLoading } = useShift();
  const queryClient = useQueryClient();

  const userRoles = useMemo(() => (user?.roles || []).map(r => (typeof r === 'string' ? r : r.name || "").toLowerCase()), [user]);
  const isAdmin = useMemo(() =>
    userRoles.includes("super admin") ||
    userRoles.includes("admin") ||
    (typeof hasPermission === "function" && hasPermission("manage_users")),
    [userRoles, hasPermission]);
  const isCashier = useMemo(() => userRoles.includes("cashier"), [userRoles]);
  const needsShift = isCashier;

  // State
  // React Query Fetching
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products-pos"],
    queryFn: async () => {
      const res = await getProducts(token);
      return res.data?.filter(p => p.is_active) || [];
    },
    enabled: !!token
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const res = await fetchCustomersList(token);
      return Array.isArray(res.data) ? res.data : (res.data.data || []);
    },
    enabled: !!token
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-flat"],
    queryFn: async () => {
      const res = await fetchCategoriesFlat(token);
      return res.data || [];
    },
    enabled: !!token
  });

  const { data: discountsData } = useQuery({
    queryKey: ["discounts-pos"],
    queryFn: async () => {
      const res = await fetchDiscountsList(token);
      const now = new Date();
      return res.data?.filter(d => {
        if (!d.isActive) return false;
        if (d.startDate && new Date(d.startDate) > now) return false;
        if (d.endDate && new Date(d.endDate) < now) return false;
        return true;
      }) || [];
    },
    enabled: !!token
  });

  const products = productsData || [];
  const customers = customersData || [];
  const categories = categoriesData || [];
  const discounts = discountsData || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [posPage, setPosPage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const itemsPerPage = 12;

  // Filter Logic (Moved up to prevent ReferenceError)
  const getDescendantCategoryIds = (catId) => {
    const ids = [catId];
    const children = categories.filter(c => c.parentId === catId);
    children.forEach(child => ids.push(...getDescendantCategoryIds(child.id)));
    return ids;
  };

  const filteredProducts = useMemo(() => {
    const descendantIds = selectedCategoryId ? getDescendantCategoryIds(selectedCategoryId) : [];
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategoryId ? descendantIds.includes(p.category_id) : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryId, categories]);

  // Barcode Scanner Logic
  const barcodeBuffer = useRef("");
  const lastBarcodeCharTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't process barcode if a modal is open
      if (showReceipt || showShiftModal) return;

      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      const isSearchInput = document.activeElement.classList.contains('pos-search-input');

      // If we are in the search input, let its own onKeyDown handle the Enter
      if (e.key === 'Enter' && isSearchInput) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastBarcodeCharTime.current;

      // Scanners are extremely fast (usually < 20ms between keys)
      if (timeDiff > 50) {
        barcodeBuffer.current = "";
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 2) {
          const sku = barcodeBuffer.current.trim();
          const product = products.find(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase());

          if (product) {
            addToCart(product);
            toast.success(`Scanned: ${product.name}`, { autoClose: 1500, position: "bottom-center" });
            if (isInput) {
              e.preventDefault();
              document.activeElement.value = "";
            }
          }
          barcodeBuffer.current = "";
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }

      lastBarcodeCharTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, showReceipt, showShiftModal, searchTerm, filteredProducts]);

  useEffect(() => {
    if (settings?.payment?.defaultMethod) {
      setPaymentMethod(settings.payment.defaultMethod);
    }
  }, [settings]);


  const totalPosPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (posPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, posPage]);

  // Cart Operations
  const addToCart = (product) => {
    if (product.stock <= 0) return toast.error("Product out of stock");
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error("Stock limit reached");
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1, line_total: (item.qty + 1) * item.price } : item
        );
      }
      return [{
        product_id: product.id, id: product.id, name: product.name,
        price: parseFloat(product.price), qty: 1, line_total: parseFloat(product.price)
      }, ...prev];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        const product = products.find(p => p.id === id);
        if (delta > 0 && newQty > (product?.stock || 0)) {
          toast.error("Stock limit reached");
          return item;
        }
        return { ...item, qty: newQty, line_total: newQty * item.price };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.line_total || 0), 0);
  const taxRate = settings.tax?.enableTax ? (parseFloat(settings.tax.taxRate) || 0) : 0;
  const taxName = settings.tax?.taxName || "Tax";

  const calculateSaving = (discount, currentCart) => {
    try {
      if (!discount || !currentCart || currentCart.length === 0) return 0;
      let totalD = 0;
      const productsList = products || [];
      const hasProductRestr = (discount.products?.length || 0) > 0;
      const hasCategoryRestr = (discount.categories?.length || 0) > 0;
      const discVal = parseFloat(discount.value) || 0;

      currentCart.forEach(item => {
        const pInfo = productsList.find(p => p.id === item.id);
        let applies = false;
        if (!hasProductRestr && !hasCategoryRestr) applies = true;
        else {
          if (hasProductRestr && discount.products?.some(sp => String(sp.productId) === String(item.id))) applies = true;
          if (hasCategoryRestr && pInfo && discount.categories?.some(sc => String(sc.categoryId) === String(pInfo.category_id))) applies = true;
        }

        if (applies && discount.type === 'percentage') {
          totalD += (item.line_total || 0) * (discVal / 100);
        }
      });

      if (discount.type === 'flat') {
        const hasAny = currentCart.some(item => {
          const pInfo = productsList.find(p => p.id === item.id);
          if (!hasProductRestr && !hasCategoryRestr) return true;
          if (hasProductRestr && discount.products?.some(sp => String(sp.productId) === String(item.id))) return true;
          if (hasCategoryRestr && pInfo && discount.categories?.some(sc => String(sc.categoryId) === String(pInfo.category_id))) return true;
          return false;
        });
        return hasAny ? Math.min(discVal, cartSubtotal) : 0;
      }
      return Math.min(totalD, cartSubtotal) || 0;
    } catch (e) { return 0; }
  };

  const applicableDiscounts = useMemo(() => {
    return discounts.filter(d => calculateSaving(d, cart) > 0);
  }, [discounts, cart]);

  const selectedDiscount = useMemo(() => {
    return discounts.find(d => String(d.id) === String(selectedDiscountId));
  }, [selectedDiscountId, discounts]);

  const discountAmount = calculateSaving(selectedDiscount, cart);
  const tax = (cartSubtotal - discountAmount) * (taxRate / 100);
  const total = cartSubtotal - discountAmount + tax;
  const change = paidAmount ? parseFloat(paidAmount) - total : 0;

  useEffect(() => {
    if (cart.length === 0) {
      setSelectedDiscountId("");
      return;
    }
    if (applicableDiscounts.length > 0) {
      let bestD = null;
      let maxSaving = -1;
      applicableDiscounts.forEach(d => {
        const s = calculateSaving(d, cart);
        if (s > maxSaving) { maxSaving = s; bestD = d; }
      });
      if (!selectedDiscountId || !applicableDiscounts.some(ad => String(ad.id) === String(selectedDiscountId))) {
        if (bestD) setSelectedDiscountId(String(bestD.id));
      }
    } else {
      setSelectedDiscountId("");
    }
  }, [cart, applicableDiscounts]);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (paidAmount && parseFloat(paidAmount) < total) return toast.error("Insufficient payment");

    const method = paymentMethod.toLowerCase();
    if ((method === 'card' || method === 'online') && !paymentReference.trim()) {
      return toast.error(`Reference ID required for ${paymentMethod}`);
    }

    const saleData = {
      customer_id: selectedCustomer || null,
      items: cart,
      subtotal: cartSubtotal,
      discount: discountAmount,
      discount_id: selectedDiscountId || null,
      tax: tax,
      total: total,
      payment_method: paymentMethod,
      paid_amount: paidAmount || total,
      change_amount: change > 0 ? change : 0,
      payment_reference: paymentReference || null
    };

    try {
      const res = await createSale(saleData, token);
      setLastSale({ ...res.data, items: cart });
      toast.success("Sale completed");
      window.dispatchEvent(new CustomEvent("saleCompleted"));
      setCart([]); setPaidAmount(""); setPaymentReference(""); setSelectedCustomer("");
      setSelectedDiscountId(""); setShowReceipt(true);
      queryClient.invalidateQueries({ queryKey: ["products-pos"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["lowStock"] });
    } catch (err) {
      toast.error(err.response?.data?.error || "Checkout failed");
    }
  };

  const handleAddCustomer = async (newCust) => {
    setIsSavingCustomer(true);
    try {
      const res = await createCustomer(newCust, token);
      toast.success("Customer added");
      setSelectedCustomer(res.data.id);
      queryClient.invalidateQueries({ queryKey: ["customers-list"] });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Error adding customer");
      return false;
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleSearchEnter = () => {
    if (filteredProducts.length > 0) {
      const product = filteredProducts[0];
      addToCart(product);
      toast.success(`Added: ${product.name}`, { autoClose: 1000, position: "bottom-center" });
      setSearchTerm("");
      barcodeBuffer.current = ""; // Clear buffer to prevent double add from global listener
    } else {
      toast.info("No product found matching search", { autoClose: 1500 });
    }
  };

  return (
    <div className="p-3 h-100 pos-container position-relative">
      <POSShiftOverlay
        needsShift={needsShift}
        activeShift={activeShift}
        shiftLoading={shiftLoading}
        onStartShift={() => setShowShiftModal(true)}
      />

      <Row className="h-100 g-3">
        {/* Left Side: Product Discovery */}
        <Col lg={8} xl={8} className="d-flex flex-column h-100">
          <POSHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            totalProducts={filteredProducts.length}
            currentPage={posPage}
            totalPages={totalPosPages}
            onSearchEnter={handleSearchEnter}
          />

          <POSCategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => { setSelectedCategoryId(id); setPosPage(1); }}
          />

          <POSProductGrid
            products={products}
            paginatedProducts={paginatedProducts}
            onAdd={addToCart}
            currency={currency}
            apiBaseUrl={api.defaults.baseURL}
            onSearchClear={() => { setSearchTerm(""); setSelectedCategoryId(""); }}
            onNavigateToProducts={() => (window.location.href = "/app/products")}
            currentPage={posPage}
            totalPages={totalPosPages}
            onPageChange={setPosPage}
            discounts={discounts}
          />
        </Col>

        {/* Right Side: Cart & Billing */}
        <Col lg={4} xl={4} className="h-100">
          <div className="glass h-100 d-flex flex-column p-0 overflow-hidden shadow-soft border-0">
            <POSCustomerSearch
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              onAddCustomer={handleAddCustomer}
              isSavingCustomer={isSavingCustomer}
            />

            <POSCartList
              cart={cart}
              products={products}
              currency={currency}
              updateQty={updateQty}
              apiBaseUrl={api.defaults.baseURL}
              onClearCart={() => setCart([])}
            />

            <POSBillingSummary
              cart={cart}
              applicableDiscounts={applicableDiscounts}
              selectedDiscountId={selectedDiscountId}
              onSelectDiscount={setSelectedDiscountId}
              currency={currency}
              subtotal={cartSubtotal}
              discountAmount={discountAmount}
              tax={tax}
              taxRate={taxRate}
              taxName={taxName}
              total={total}
              change={change}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentReference={paymentReference}
              setPaymentReference={setPaymentReference}
              paidAmount={paidAmount}
              setPaidAmount={setPaidAmount}
              onCheckout={handleCheckout}
            />
          </div>
        </Col>
      </Row>

      {showReceipt && lastSale && (
        <POSReceiptModal
          show={showReceipt}
          onHide={() => setShowReceipt(false)}
          lastSale={lastSale}
          currency={currency}
          settings={settings}
        />
      )}

      {showShiftModal && (
        <ShiftModal
          show={showShiftModal}
          onHide={() => setShowShiftModal(false)}
          type="start"
          currencySymbol={currency}
        />
      )}
    </div>
  );
}
