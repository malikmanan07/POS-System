import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ChatWidget from "../components/ChatWidget";
import "../styles/landing.css";

export default function LandingPage() {
    const [navScrolled, setNavScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const pageRef = useRef(null);

    // FAQ Data
    const faqData = [
        {
            q: "Is Force POS really 100% free?",
            a: "Yes, absolutely! Force POS is <strong>completely free to use</strong> — no hidden fees, no premium tiers, no credit card required. Every single feature is unlocked from day one. We built this to empower small and medium businesses with professional tools at zero cost.",
            icon: "bi-gift"
        },
        {
            q: "What features are included for free?",
            a: "Everything! You get the full <strong>POS interface with barcode scanner</strong>, inventory management, shift management, 5 user roles with granular permissions, reports & analytics, discount campaigns, supplier management, sales returns, bulk product import, activity logs, and multi-tenant SaaS support — all free.",
            icon: "bi-stars"
        },
        {
            q: "Is there a limit on products, users, or transactions?",
            a: "No limits at all. You can add <strong>unlimited products, categories, customers, team members, and process unlimited transactions</strong>. There are no usage caps or throttling. Use it as much as you need — it's designed to scale with your business.",
            icon: "bi-infinity"
        },
        {
            q: "How do I get started with Force POS?",
            a: "Getting started takes under 2 minutes. Simply <strong>click 'Create Free Account'</strong>, enter your business name, email, and password — that's it! You'll get instant access to your dashboard as a Super Admin. From there, you can import products, invite team members, and start selling immediately.",
            icon: "bi-rocket-takeoff"
        },
        {
            q: "Can I manage multiple staff members with different permissions?",
            a: "Yes! Force POS includes a powerful <strong>Role-Based Access Control</strong> system with 5 built-in roles: Super Admin, Admin, Manager, Cashier, and Accountant. Each role has customizable permissions, so every team member sees only what they need. You can invite unlimited staff members.",
            icon: "bi-people"
        },
        {
            q: "Does Force POS work on mobile devices?",
            a: "Force POS is built with a <strong>responsive design</strong> that works on desktops, tablets, and mobile browsers. The POS interface is optimized for touch screens, making it easy to process sales on tablets at your counter. No app download required — it works directly in your browser.",
            icon: "bi-phone"
        },
        {
            q: "Is my business data secure?",
            a: "Absolutely. Security is a top priority. Force POS uses <strong>JWT-based authentication</strong>, encrypted passwords, role-based access control, and complete data isolation between businesses (multi-tenant architecture). Your data is private and only accessible to your authorized team members.",
            icon: "bi-shield-lock"
        },
        {
            q: "Can I import my existing product catalog?",
            a: "Yes! Force POS includes a <strong>Bulk Product Import</strong> feature that lets you import thousands of products instantly via CSV or Excel files. You can map columns, validate data, and build your entire catalog in minutes instead of adding products one by one.",
            icon: "bi-file-earmark-spreadsheet"
        },
        {
            q: "What payment methods does the POS support?",
            a: "The POS interface supports <strong>Cash, Card, and Online payment methods</strong>. You can configure your accepted payment methods in Business Settings. The system tracks payment types in sales reports so you can see revenue breakdown by payment method.",
            icon: "bi-credit-card"
        },
        {
            q: "Can I track inventory and get low stock alerts?",
            a: "Yes! The inventory system provides <strong>real-time stock tracking</strong> with product variants, SKU management, configurable low stock thresholds, automatic alerts, stock movement history, and stock adjustment with reason tracking. You'll never run out of stock unexpectedly again.",
            icon: "bi-box-seam"
        },
    ];

    // Inject FAQPage JSON-LD Schema for Google Rich Results
    useEffect(() => {
        const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
                "@type": "Question",
                "name": faq.q,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.a.replace(/<\/?strong>/g, '')
                }
            }))
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'faq-schema';
        script.textContent = JSON.stringify(faqSchema);

        // Remove existing if re-rendered
        const existing = document.getElementById('faq-schema');
        if (existing) existing.remove();

        document.head.appendChild(script);
        return () => {
            const el = document.getElementById('faq-schema');
            if (el) el.remove();
        };
    }, []);    // Scroll-based nav background
    useEffect(() => {
        const container = pageRef.current;
        if (!container) return;
        const handleScroll = () => setNavScrolled(container.scrollTop > 60);
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // Scroll reveal
    useEffect(() => {
        const container = pageRef.current;
        if (!container) return;
        const els = container.querySelectorAll(".lp-reveal");
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
            { threshold: 0.12, root: container }
        );
        els.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Count-up animation
    useEffect(() => {
        const container = pageRef.current;
        if (!container) return;
        const counters = container.querySelectorAll("[data-count]");
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const target = parseInt(el.getAttribute("data-count"), 10);
                        const suffix = el.getAttribute("data-suffix") || "";
                        const prefix = el.getAttribute("data-prefix") || "";
                        let current = 0;
                        const increment = Math.max(1, Math.ceil(target / 60));
                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= target) { current = target; clearInterval(timer); }
                            el.textContent = prefix + current.toLocaleString() + suffix;
                        }, 25);
                        observer.unobserve(el);
                    }
                });
            },
            { threshold: 0.5, root: container }
        );
        counters.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    // Feature data
    const features = [
        { icon: "bi-cart3", color: "purple", title: "POS Interface", desc: "Lightning-fast checkout with barcode scanner support, smart cart management, automatic discount application, and support for Cash, Card & Online payments." },
        { icon: "bi-box-seam", color: "green", title: "Inventory Management", desc: "Full stock tracking with product variants, SKU management, purchase cost validation, batch tracking, and real-time low stock alerts." },
        { icon: "bi-clock-history", color: "blue", title: "Shift Management", desc: "Complete cashier shift system with opening/closing balances, cash reconciliation, and detailed shift reports for every register." },
        { icon: "bi-shield-lock", color: "amber", title: "Role-Based Access", desc: "Granular permissions with 5 built-in roles — Super Admin, Admin, Manager, Cashier & Accountant with fully customizable access levels." },
        { icon: "bi-graph-up-arrow", color: "rose", title: "Reports & Analytics", desc: "Interactive revenue charts, best-selling products analysis, customer breakdown reports, with complete data export to PDF & CSV formats." },
        { icon: "bi-journal-text", color: "cyan", title: "Activity Log", desc: "Comprehensive audit trail tracking every action across the entire system with automatic 30/90 day cleanup and filtering capabilities." },
        { icon: "bi-truck", color: "emerald", title: "Supplier Management", desc: "Organize supplier profiles linked to products, track supplier details, contact information, and purchasing history in one place." },
        { icon: "bi-percent", color: "indigo", title: "Discount Campaigns", desc: "Create flexible flat or percentage discount campaigns, set validity periods, and watch them auto-apply during checkout at POS." },
        { icon: "bi-arrow-return-left", color: "orange", title: "Sales Returns", desc: "Process sales returns seamlessly with automatic stock restoration, refund tracking, and complete return history documentation." },
        { icon: "bi-file-earmark-spreadsheet", color: "teal", title: "Bulk Product Import", desc: "Import thousands of products instantly via CSV/Excel files. Map columns, validate data, and build your catalog in minutes." },
        { icon: "bi-buildings", color: "violet", title: "Multi-Tenant SaaS", desc: "Run multiple businesses on a single platform with complete data isolation, individual business settings, and independent user management." },
    ];

    // Roles data
    const roles = [
        { icon: "bi-star-fill", color: "purple", name: "Super Admin", desc: "Complete system access with all permissions" },
        { icon: "bi-person-gear", color: "blue", name: "Admin", desc: "Full access except system-level settings" },
        { icon: "bi-briefcase", color: "emerald", name: "Manager", desc: "Sales, inventory, and report management" },
        { icon: "bi-cash-stack", color: "amber", name: "Cashier", desc: "POS operations and shift management" },
        { icon: "bi-calculator", color: "rose", name: "Accountant", desc: "Sales data and financial reports access" },
    ];

    const techStack = [
        { icon: "bi-filetype-jsx", color: "cyan", name: "React", label: "Frontend" },
        { icon: "bi-lightning-charge", color: "amber", name: "Vite", label: "Build Tool" },
        { icon: "bi-server", color: "green", name: "Node.js", label: "Backend" },
        { icon: "bi-database", color: "blue", name: "PostgreSQL", label: "Database" },
        { icon: "bi-layers", color: "purple", name: "Drizzle ORM", label: "ORM" },
        { icon: "bi-key", color: "rose", name: "JWT Auth", label: "Security" },
    ];

    return (
        <div className="landing-page" ref={pageRef}>
            {/* Background Effects */}
            <div className="landing-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <div className="orb orb-4"></div>
            </div>

            {/* Floating Particles */}
            <div className="lp-particles">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="lp-particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${8 + Math.random() * 15}s`,
                            animationDelay: `${Math.random() * 10}s`,
                            width: `${2 + Math.random() * 3}px`,
                            height: `${2 + Math.random() * 3}px`,
                            background: i % 3 === 0
                                ? "rgba(34, 197, 94, 0.3)"
                                : "rgba(109, 94, 252, 0.3)",
                        }}
                    />
                ))}
            </div>

            {/* ============ NAVIGATION ============ */}
            <nav className={`lp-nav ${navScrolled ? "scrolled" : ""}`}>
                <div className="lp-container-wide">
                    <div className="lp-nav-inner">
                        <a href="#hero" className="lp-logo" onClick={(e) => { e.preventDefault(); scrollTo("hero"); }}>
                            <div className="lp-logo-icon">
                                <i className="bi bi-lightning-charge-fill"></i>
                            </div>
                            <div className="lp-logo-text">
                                Force <span>POS</span>
                            </div>
                        </a>

                        <ul className="lp-nav-links">
                            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>Features</a></li>
                            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo("how-it-works"); }}>How It Works</a></li>
                            <li><a href="#pos-showcase" onClick={(e) => { e.preventDefault(); scrollTo("pos-showcase"); }}>POS</a></li>
                            <li><a href="#inventory-showcase" onClick={(e) => { e.preventDefault(); scrollTo("inventory-showcase"); }}>Inventory</a></li>
                            <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo("pricing"); }}>Pricing</a></li>
                            <li><a href="#tech" onClick={(e) => { e.preventDefault(); scrollTo("tech"); }}>Tech Stack</a></li>
                        </ul>

                        <div className="lp-nav-cta">
                            <Link to="/login" className="lp-btn lp-btn-ghost">Sign In</Link>
                            <Link to="/signup" className="lp-btn lp-btn-primary">Get Started — It's Free</Link>
                        </div>

                        <button className="lp-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
                            <i className="bi bi-list"></i>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`lp-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
                <button className="lp-mobile-close" onClick={() => setMobileMenuOpen(false)}>
                    <i className="bi bi-x-lg"></i>
                </button>
                <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>Features</a>
                <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo("how-it-works"); }}>How It Works</a>
                <a href="#pos-showcase" onClick={(e) => { e.preventDefault(); scrollTo("pos-showcase"); }}>POS</a>
                <a href="#inventory-showcase" onClick={(e) => { e.preventDefault(); scrollTo("inventory-showcase"); }}>Inventory</a>
                <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo("pricing"); }}>Pricing</a>
                <a href="#tech" onClick={(e) => { e.preventDefault(); scrollTo("tech"); }}>Tech Stack</a>
                <Link to="/login" className="lp-btn lp-btn-ghost" style={{ marginTop: 20 }}>Sign In</Link>
                <Link to="/signup" className="lp-btn lp-btn-primary">Get Started — It's Free</Link>
            </div>

            {/* ============ HERO ============ */}
            <section className="lp-section lp-hero" id="hero">
                <div className="lp-container">
                    <div className="lp-hero-badge">
                        <span className="dot"></span>
                        ✨ 100% Free — No Credit Card Required
                    </div>
                    <h1>
                        The Future of<br />
                        <span className="gradient-text">Retail Management</span>
                    </h1>
                    <p className="lp-hero-subtitle">
                        Force POS is a <strong style={{ color: 'white' }}>completely free</strong>, enterprise-grade Point of Sale system built for modern retailers.
                        Manage sales, inventory, staff, reports & more — all features unlocked, <strong style={{ color: 'white' }}>forever free</strong>.
                    </p>
                    <div className="lp-hero-cta">
                        <Link to="/signup" className="lp-btn lp-btn-gradient">
                            <i className="bi bi-rocket-takeoff"></i> Get Started — It's Free
                        </Link>
                        <a href="#pricing" className="lp-btn lp-btn-outline" onClick={(e) => { e.preventDefault(); scrollTo("pricing"); }}>
                            <i className="bi bi-gift"></i> See Why It's Free
                        </a>
                    </div>
                    <div className="lp-hero-stats">
                        <div className="lp-hero-stat">
                            <span className="number" style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$0</span>
                            <span className="label">Forever Free</span>
                        </div>
                        <div className="lp-hero-stat">
                            <span className="number" data-count="11" data-suffix="+">0+</span>
                            <span className="label">Free Modules</span>
                        </div>
                        <div className="lp-hero-stat">
                            <span className="number" data-count="5">0</span>
                            <span className="label">User Roles</span>
                        </div>
                        <div className="lp-hero-stat">
                            <span className="number">∞</span>
                            <span className="label">Unlimited Usage</span>
                        </div>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="lp-hero-preview">
                        <div className="lp-preview-glow"></div>
                        <div className="lp-preview-frame">
                            <div className="lp-preview-bar">
                                <div className="lp-preview-dot"></div>
                                <div className="lp-preview-dot"></div>
                                <div className="lp-preview-dot"></div>
                                <span style={{ marginLeft: 12, fontSize: 13, color: "var(--lp-muted)", fontWeight: 500 }}>Force POS — Dashboard</span>
                            </div>
                            <div className="lp-preview-content">
                                <div className="lp-preview-sidebar">
                                    <div className="lp-preview-nav-item active"><i className="bi bi-speedometer2"></i> Dashboard</div>
                                    <div className="lp-preview-nav-item"><i className="bi bi-box-seam"></i> Products</div>
                                    <div className="lp-preview-nav-item"><i className="bi bi-tags"></i> Categories</div>
                                    <div className="lp-preview-nav-item"><i className="bi bi-people"></i> Customers</div>
                                    <div className="lp-preview-nav-item"><i className="bi bi-receipt"></i> Sales</div>
                                    <div className="lp-preview-nav-item"><i className="bi bi-cart3"></i> POS</div>
                                    <div className="lp-preview-nav-item"><i className="bi bi-graph-up-arrow"></i> Reports</div>
                                    <div className="lp-preview-nav-item"><i className="bi bi-boxes"></i> Inventory</div>
                                    <div className="lp-preview-nav-item"><i className="bi bi-gear"></i> Settings</div>
                                </div>
                                <div className="lp-preview-main">
                                    <div className="lp-preview-kpis">
                                        <div className="lp-preview-kpi">
                                            <div className="kpi-icon" style={{ background: "rgba(109,94,252,0.12)", color: "#8b7dff" }}><i className="bi bi-box-seam"></i></div>
                                            <div className="kpi-val">2,847</div>
                                            <div className="kpi-label">Total Products</div>
                                        </div>
                                        <div className="lp-preview-kpi">
                                            <div className="kpi-icon" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}><i className="bi bi-currency-dollar"></i></div>
                                            <div className="kpi-val">$48.2K</div>
                                            <div className="kpi-label">Today Revenue</div>
                                        </div>
                                        <div className="lp-preview-kpi">
                                            <div className="kpi-icon" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}><i className="bi bi-people"></i></div>
                                            <div className="kpi-val">1,203</div>
                                            <div className="kpi-label">Customers</div>
                                        </div>
                                        <div className="lp-preview-kpi">
                                            <div className="kpi-icon" style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24" }}><i className="bi bi-exclamation-triangle"></i></div>
                                            <div className="kpi-val">18</div>
                                            <div className="kpi-label">Low Stock Items</div>
                                        </div>
                                    </div>
                                    <div className="lp-preview-chart">
                                        <div className="chart-title">Revenue Overview — Last 7 Days</div>
                                        <div className="lp-chart-bars">
                                            {[65, 80, 55, 90, 70, 95, 85].map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="lp-chart-bar"
                                                    data-label={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                                                    style={{
                                                        height: `${h}%`,
                                                        background: `linear-gradient(to top, rgba(109,94,252,0.6), rgba(34,197,94,${0.3 + i * 0.05}))`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ TRUSTED BY ============ */}
            <section className="lp-trusted lp-section" style={{ padding: "50px 0" }}>
                <div className="lp-container-wide">
                    <div className="lp-trusted-title">Trusted by businesses worldwide</div>
                    <div className="lp-trusted-logos">
                        <div className="lp-trusted-logo"><i className="bi bi-shop"></i> RetailPro</div>
                        <div className="lp-trusted-logo"><i className="bi bi-bag"></i> ShopVerse</div>
                        <div className="lp-trusted-logo"><i className="bi bi-cup-hot"></i> CaféChain</div>
                        <div className="lp-trusted-logo"><i className="bi bi-phone"></i> TechMart</div>
                        <div className="lp-trusted-logo"><i className="bi bi-basket"></i> GrocerEasy</div>
                        <div className="lp-trusted-logo"><i className="bi bi-gem"></i> LuxeStore</div>
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ FEATURES ============ */}
            <section className="lp-section" id="features">
                <div className="lp-container-wide">
                    <div className="lp-section-header lp-reveal">
                        <div className="lp-section-badge"><i className="bi bi-stars"></i> All Features Free</div>
                        <h2 className="lp-section-title">Every Feature, <br />Zero Cost</h2>
                        <p className="lp-section-subtitle">
                            All 11+ powerful modules are completely free. No premium tiers, no feature locks — you get everything from day one.
                        </p>
                    </div>
                    <div className="lp-features-grid">
                        {features.map((f, i) => (
                            <div key={i} className={`lp-feature-card lp-reveal lp-reveal-delay-${(i % 6) + 1}`}>
                                <div className={`lp-feature-icon ${f.color}`}>
                                    <i className={`bi ${f.icon}`}></i>
                                </div>
                                <div className="lp-feature-title">{f.title}</div>
                                <p className="lp-feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ HOW IT WORKS ============ */}
            <section className="lp-section" id="how-it-works">
                <div className="lp-container">
                    <div className="lp-section-header lp-reveal">
                        <div className="lp-section-badge"><i className="bi bi-signpost-2"></i> How It Works</div>
                        <h2 className="lp-section-title">Up & Running in Minutes</h2>
                        <p className="lp-section-subtitle">
                            Getting started is quick and 100% free. No complex setup, no hidden fees, no credit card needed.
                        </p>
                    </div>
                    <div className="lp-steps lp-reveal">
                        <div className="lp-step">
                            <div className="lp-step-number">1</div>
                            <div className="lp-step-title">Register Business</div>
                            <div className="lp-step-desc">Sign up free with your business name and get your Super Admin account instantly — no credit card</div>
                        </div>
                        <div className="lp-step">
                            <div className="lp-step-number">2</div>
                            <div className="lp-step-title">Set Up Catalog</div>
                            <div className="lp-step-desc">Import products via CSV/Excel or add them manually with categories, variants & pricing</div>
                        </div>
                        <div className="lp-step">
                            <div className="lp-step-number">3</div>
                            <div className="lp-step-title">Add Team Members</div>
                            <div className="lp-step-desc">Invite staff with roles — Admins, Managers, Cashiers, Accountants — each with custom permissions</div>
                        </div>
                        <div className="lp-step">
                            <div className="lp-step-number">4</div>
                            <div className="lp-step-title">Start Selling</div>
                            <div className="lp-step-desc">Open POS, scan barcodes, process payments — all features unlocked, forever free, no limits</div>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ POS SHOWCASE ============ */}
            <section className="lp-section" id="pos-showcase">
                <div className="lp-container-wide">
                    <div className="lp-showcase lp-reveal">
                        <div className="lp-showcase-content">
                            <div className="lp-section-badge"><i className="bi bi-cart3"></i> Point of Sale</div>
                            <h3>Blazing Fast<br />Checkout Experience</h3>
                            <p>
                                Our POS interface is designed for speed & accuracy. Process transactions in seconds
                                with an intuitive interface your cashiers will love from day one.
                            </p>
                            <ul className="lp-showcase-list">
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Barcode scanner support for instant product lookup</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Smart cart with real-time price calculation</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Automatic discount campaign application</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Cash, Card & Online payment methods</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Instant digital receipt generation</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Customer selection for loyalty tracking</li>
                            </ul>
                        </div>
                        <div className="lp-showcase-visual">
                            <div className="lp-showcase-card">
                                {/* Simulated POS Interface */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6d5efc, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 }}>
                                        <i className="bi bi-cart3"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>Point of Sale</div>
                                        <div style={{ fontSize: 12, color: "var(--lp-muted)" }}>Walk-in Customer • 3 items</div>
                                    </div>
                                </div>
                                {/* Cart items */}
                                {[
                                    { name: "Wireless Earbuds Pro", qty: 2, price: "$59.99", letter: "W" },
                                    { name: "USB-C Charging Cable", qty: 1, price: "$12.99", letter: "U" },
                                    { name: "Phone Case Premium", qty: 1, price: "$24.99", letter: "P" },
                                ].map((item, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg, rgba(109,94,252,0.15), rgba(34,197,94,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--lp-primary-light)", fontSize: 14, flexShrink: 0 }}>{item.letter}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: "white" }}>{item.name}</div>
                                            <div style={{ fontSize: 12, color: "var(--lp-muted)" }}>Qty: {item.qty}</div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: "var(--lp-green)", fontSize: 15 }}>{item.price}</div>
                                    </div>
                                ))}
                                {/* Totals */}
                                <div style={{ marginTop: 20, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ color: "var(--lp-muted)", fontSize: 14 }}>Subtotal</span>
                                        <span style={{ color: "white", fontWeight: 600 }}>$157.96</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ color: "var(--lp-green)", fontSize: 14 }}>Discount (10%)</span>
                                        <span style={{ color: "var(--lp-green)", fontWeight: 600 }}>-$15.80</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: "white", marginTop: 8 }}>
                                        <span>Total</span>
                                        <span>$142.16</span>
                                    </div>
                                </div>
                                {/* Payment buttons */}
                                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                                    {["Cash", "Card", "Online"].map((m, i) => (
                                        <div key={i} style={{
                                            flex: 1, textAlign: "center", padding: "10px", borderRadius: 10,
                                            background: i === 0 ? "var(--lp-primary)" : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${i === 0 ? "var(--lp-primary)" : "rgba(255,255,255,0.08)"}`,
                                            color: i === 0 ? "white" : "var(--lp-muted)",
                                            fontWeight: 600, fontSize: 13
                                        }}>{m}</div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 16, background: "linear-gradient(135deg, var(--lp-primary), #8b5cf6)", borderRadius: 14, padding: "14px", textAlign: "center", fontWeight: 800, color: "white", fontSize: 15 }}>
                                    <i className="bi bi-check2-circle" style={{ marginRight: 8 }}></i>Complete Checkout
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ INVENTORY SHOWCASE ============ */}
            <section className="lp-section" id="inventory-showcase">
                <div className="lp-container-wide">
                    <div className="lp-showcase reverse lp-reveal">
                        <div className="lp-showcase-content">
                            <div className="lp-section-badge"><i className="bi bi-boxes"></i> Inventory</div>
                            <h3>Complete Stock Control<br />at Your Fingertips</h3>
                            <p>
                                Never run out of stock again. Our intelligent inventory system keeps track of every
                                product, variant, and movement across your entire operation.
                            </p>
                            <ul className="lp-showcase-list">
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Product variants with individual SKU tracking</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Real-time stock levels with 10-second polling</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Low stock alerts with configurable thresholds</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Purchase cost validation on all stock operations</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Complete stock movement history & audit trail</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Stock adjustment with reason tracking</li>
                            </ul>
                        </div>
                        <div className="lp-showcase-visual">
                            <div className="lp-showcase-card">
                                {/* Simulated Inventory */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e", fontSize: 18 }}>
                                        <i className="bi bi-boxes"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>Manage Stock</div>
                                        <div style={{ fontSize: 12, color: "var(--lp-muted)" }}>247 products tracked</div>
                                    </div>
                                </div>
                                {/* Stock items */}
                                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "var(--lp-muted)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                        <span>Product</span><span>SKU</span><span>Stock</span><span>Status</span>
                                    </div>
                                    {[
                                        { name: "Wireless Earbuds", sku: "WE-001", stock: 142, status: "In Stock", statusColor: "#22c55e" },
                                        { name: "USB-C Cable", sku: "UC-034", stock: 8, status: "Low Stock", statusColor: "#f59e0b" },
                                        { name: "Phone Case", sku: "PC-112", stock: 0, status: "Out", statusColor: "#ef4444" },
                                        { name: "Screen Protector", sku: "SP-056", stock: 89, status: "In Stock", statusColor: "#22c55e" },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: "white" }}>{item.name}</span>
                                            <span style={{ fontSize: 12, color: "var(--lp-muted)", fontFamily: "monospace" }}>{item.sku}</span>
                                            <span style={{ fontWeight: 700, fontSize: 14, color: "white" }}>{item.stock}</span>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: item.statusColor, background: `${item.statusColor}15`, padding: "4px 8px", borderRadius: 6, display: "inline-block", textAlign: "center" }}>{item.status}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Quick stats */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
                                    <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "#22c55e" }}>247</div>
                                        <div style={{ fontSize: 10, color: "var(--lp-muted)" }}>Total Items</div>
                                    </div>
                                    <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24" }}>12</div>
                                        <div style={{ fontSize: 10, color: "var(--lp-muted)" }}>Low Stock</div>
                                    </div>
                                    <div style={{ background: "rgba(239,68,68,0.08)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>3</div>
                                        <div style={{ fontSize: 10, color: "var(--lp-muted)" }}>Out of Stock</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ REPORTS & ANALYTICS SHOWCASE ============ */}
            <section className="lp-section" id="reports-showcase">
                <div className="lp-container-wide">
                    <div className="lp-showcase lp-reveal">
                        <div className="lp-showcase-content">
                            <div className="lp-section-badge"><i className="bi bi-graph-up-arrow"></i> Analytics</div>
                            <h3>Data-Driven Insights<br />for Smarter Decisions</h3>
                            <p>
                                Transform raw sales data into actionable business intelligence. Our reporting engine
                                gives you the clarity needed to optimize operations and maximize profits.
                            </p>
                            <ul className="lp-showcase-list">
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Interactive revenue charts with date filters</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Best-selling products analysis</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Customer breakdown & purchasing patterns</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Export reports to PDF & CSV formats</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Daily, weekly, monthly & custom date ranges</li>
                                <li><span className="check-icon"><i className="bi bi-check2"></i></span> Sales comparison & trend analysis</li>
                            </ul>
                        </div>
                        <div className="lp-showcase-visual">
                            <div className="lp-showcase-card">
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(244,63,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb7185", fontSize: 18 }}>
                                        <i className="bi bi-graph-up-arrow"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>Reports & Analytics</div>
                                        <div style={{ fontSize: 12, color: "var(--lp-muted)" }}>This Month Overview</div>
                                    </div>
                                </div>
                                {/* Revenue stats */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                    <div style={{ background: "rgba(109,94,252,0.08)", borderRadius: 12, padding: 16 }}>
                                        <div style={{ fontSize: 12, color: "var(--lp-muted)", marginBottom: 4 }}>Total Revenue</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>$124.8K</div>
                                        <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>↑ 12.5% vs last month</div>
                                    </div>
                                    <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: 12, padding: 16 }}>
                                        <div style={{ fontSize: 12, color: "var(--lp-muted)", marginBottom: 4 }}>Total Orders</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>3,847</div>
                                        <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>↑ 8.3% vs last month</div>
                                    </div>
                                </div>
                                {/* Mini chart */}
                                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.04)" }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 12 }}>Top Selling Products</div>
                                    {[
                                        { name: "Wireless Earbuds Pro", sales: 847, pct: 85 },
                                        { name: "USB-C Cable Bundle", sales: 623, pct: 62 },
                                        { name: "Smart Watch Band", sales: 412, pct: 41 },
                                        { name: "Phone Case Premium", sales: 389, pct: 39 },
                                    ].map((p, i) => (
                                        <div key={i} style={{ marginBottom: 10 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                                <span style={{ color: "var(--lp-text)" }}>{p.name}</span>
                                                <span style={{ color: "var(--lp-muted)" }}>{p.sales} sold</span>
                                            </div>
                                            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
                                                <div style={{ height: "100%", width: `${p.pct}%`, borderRadius: 3, background: `linear-gradient(90deg, var(--lp-primary), var(--lp-green))` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ ROLES ============ */}
            <section className="lp-section" id="roles">
                <div className="lp-container">
                    <div className="lp-section-header lp-reveal">
                        <div className="lp-section-badge"><i className="bi bi-people-fill"></i> Access Control</div>
                        <h2 className="lp-section-title">Five Powerful Roles<br />for Complete Control</h2>
                        <p className="lp-section-subtitle">
                            Each role comes with granular, customizable permissions so every team member sees exactly what they need
                        </p>
                    </div>
                    <div className="lp-roles-grid lp-reveal">
                        {roles.map((r, i) => (
                            <div key={i} className={`lp-role-card lp-reveal-delay-${i + 1}`}>
                                <div className={`lp-role-icon ${r.color}`}>
                                    <i className={`bi ${r.icon}`}></i>
                                </div>
                                <div className="lp-role-name">{r.name}</div>
                                <div className="lp-role-desc">{r.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ TECH STACK ============ */}
            <section className="lp-section" id="tech">
                <div className="lp-container">
                    <div className="lp-section-header lp-reveal">
                        <div className="lp-section-badge"><i className="bi bi-cpu"></i> Technology</div>
                        <h2 className="lp-section-title">Built with Modern Tech</h2>
                        <p className="lp-section-subtitle">
                            Enterprise-grade technology stack designed for performance, scalability, and developer experience
                        </p>
                    </div>
                    <div className="lp-tech-grid lp-reveal">
                        {techStack.map((t, i) => (
                            <div key={i} className="lp-tech-item">
                                <div className={`lp-tech-icon ${t.color}`}>
                                    <i className={`bi ${t.icon}`}></i>
                                </div>
                                <div className="lp-tech-name">{t.name}</div>
                                <div className="lp-tech-label">{t.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ ADDITIONAL FEATURES ============ */}
            <section className="lp-section" id="more-features">
                <div className="lp-container">
                    <div className="lp-section-header lp-reveal">
                        <div className="lp-section-badge"><i className="bi bi-lightning-charge"></i> More Power</div>
                        <h2 className="lp-section-title">And That's Not All</h2>
                        <p className="lp-section-subtitle">
                            Force POS comes loaded with advanced features — all included for free, no upgrades needed
                        </p>
                    </div>
                    <div className="lp-features-grid lp-reveal">
                        {[
                            { icon: "bi-speedometer2", color: "purple", title: "Real-Time Dashboard", desc: "Beautiful analytics dashboard with live KPIs, revenue charts, top products, and quick action shortcuts for every role." },
                            { icon: "bi-people", color: "blue", title: "Customer Management", desc: "Full customer directory with purchase history, loyalty tracking, contact management, and customer-specific sales analytics." },
                            { icon: "bi-tags", color: "green", title: "Category Hierarchy", desc: "Multi-level category system with parent-child relationships, cascading selection, and accordion-based management interface." },
                            { icon: "bi-gear", color: "amber", title: "Business Settings", desc: "Complete customization — business info, tax rates, invoice templates, payment methods, currency, and store branding." },
                            { icon: "bi-person-check", color: "emerald", title: "User Approval System", desc: "New user accounts require admin approval before access. Pending, approved, and rejected states with full audit trail." },
                            { icon: "bi-cloud-arrow-up", color: "cyan", title: "React Query Caching", desc: "TanStack React Query v5 with 5-minute stale time, skeleton loaders, and optimistic updates for a smooth experience." },
                        ].map((f, i) => (
                            <div key={i} className={`lp-feature-card lp-reveal lp-reveal-delay-${(i % 6) + 1}`}>
                                <div className={`lp-feature-icon ${f.color}`}>
                                    <i className={`bi ${f.icon}`}></i>
                                </div>
                                <div className="lp-feature-title">{f.title}</div>
                                <p className="lp-feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ PRICING — 100% FREE ============ */}
            <section className="lp-section" id="pricing">
                <div className="lp-container">
                    <div className="lp-section-header lp-reveal">
                        <div className="lp-section-badge" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#4ade80' }}><i className="bi bi-gift"></i> Pricing</div>
                        <h2 className="lp-section-title">100% Free.<br />No Catch. Seriously.</h2>
                        <p className="lp-section-subtitle">
                            We believe every business deserves access to professional tools. That's why Force POS is completely free — forever.
                        </p>
                    </div>

                    {/* Pricing Card */}
                    <div className="lp-reveal" style={{ maxWidth: 560, margin: '0 auto' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '2px solid rgba(34,197,94,0.25)',
                            borderRadius: 28,
                            padding: '48px 40px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Glow */}
                            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.06), transparent 60%)', pointerEvents: 'none' }}></div>

                            {/* Free Badge */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 18px', borderRadius: 100,
                                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                                color: '#4ade80', fontSize: 13, fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24,
                                position: 'relative', zIndex: 1
                            }}>
                                <i className="bi bi-check-circle-fill"></i> Forever Free Plan
                            </div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: 64, fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 4 }}>
                                    $0
                                </div>
                                <div style={{ fontSize: 18, color: 'var(--lp-muted)', marginBottom: 32 }}>per month, forever</div>

                                {/* Feature List */}
                                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
                                    {[
                                        'All 11+ modules fully unlocked',
                                        'Unlimited products & categories',
                                        'Unlimited sales & transactions',
                                        'Unlimited team members & roles',
                                        'Unlimited customers',
                                        'Full POS with barcode scanner',
                                        'Complete inventory management',
                                        'Reports & analytics with export',
                                        'Discount campaigns',
                                        'Supplier management',
                                        'Activity log & audit trail',
                                        'Multi-tenant SaaS ready',
                                        'No credit card required',
                                        'No hidden fees — ever',
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--lp-text)' }}>
                                            <div style={{
                                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                                background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
                                            }}>
                                                <i className="bi bi-check2"></i>
                                            </div>
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                <Link to="/signup" className="lp-btn lp-btn-gradient" style={{ width: '100%', justifyContent: 'center' }}>
                                    <i className="bi bi-rocket-takeoff"></i> Create Free Account
                                </Link>
                                <div style={{ fontSize: 13, color: 'var(--lp-muted)', marginTop: 12 }}>
                                    No credit card • No trial period • Free forever
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Why Free */}
                    <div className="lp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 48 }}>
                        {[
                            { icon: 'bi-heart-fill', color: '#fb7185', title: 'Built with Passion', desc: 'We built Force POS to empower small businesses. Profit isn\'t our goal — your success is.' },
                            { icon: 'bi-infinity', color: '#8b7dff', title: 'No Limits Ever', desc: 'Unlimited products, users, sales, and reports. Use every feature without any restrictions.' },
                            { icon: 'bi-shield-check', color: '#22c55e', title: 'No Hidden Costs', desc: 'No surprise charges, no premium upgrades, no feature locks. What you see is what you get — free.' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 20, padding: '28px 24px', textAlign: 'center'
                            }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
                                    background: `${item.color}18`, color: item.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                                }}>
                                    <i className={`bi ${item.icon}`}></i>
                                </div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 8 }}>{item.title}</div>
                                <div style={{ fontSize: 14, color: 'var(--lp-muted)', lineHeight: 1.6 }}>{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ FAQ ============ */}
            <section className="lp-section" id="faq">
                <div className="lp-container">
                    <div className="lp-section-header lp-reveal">
                        <div className="lp-section-badge"><i className="bi bi-question-circle"></i> FAQ</div>
                        <h2 className="lp-section-title">Frequently Asked<br />Questions</h2>
                        <p className="lp-section-subtitle">
                            Got questions? We've got answers. Everything you need to know about Force POS.
                        </p>
                    </div>

                    <div className="lp-faq-list lp-reveal">
                        {faqData.map((faq, i) => (
                            <div
                                key={i}
                                className={`lp-faq-item${openFaq === i ? ' open' : ''}`}
                                itemScope
                                itemProp="mainEntity"
                                itemType="https://schema.org/Question"
                            >
                                <button
                                    className="lp-faq-question"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    aria-expanded={openFaq === i}
                                    aria-controls={`faq-answer-${i}`}
                                >
                                    <div className="lp-faq-q-left">
                                        <div className="lp-faq-q-icon">
                                            <i className={`bi ${faq.icon}`}></i>
                                        </div>
                                        <span className="lp-faq-q-text" itemProp="name">{faq.q}</span>
                                    </div>
                                    <div className="lp-faq-toggle">
                                        <i className="bi bi-plus"></i>
                                    </div>
                                </button>
                                <div
                                    className="lp-faq-answer-wrapper"
                                    id={`faq-answer-${i}`}
                                    role="region"
                                    itemScope
                                    itemProp="acceptedAnswer"
                                    itemType="https://schema.org/Answer"
                                >
                                    <div className="lp-faq-answer-inner">
                                        <div
                                            className="lp-faq-answer"
                                            itemProp="text"
                                            dangerouslySetInnerHTML={{ __html: faq.a }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lp-faq-contact lp-reveal">
                        <p>Still have questions? <a href="mailto:support@forcepos.com">Contact our team</a> — we're here to help!</p>
                    </div>
                </div>
            </section>

            <hr className="lp-divider" />

            {/* ============ CTA ============ */}
            <section className="lp-section lp-cta-section" id="cta">
                <div className="lp-container">
                    <div className="lp-cta-card lp-reveal">
                        <div className="lp-shine-line"></div>
                        <h2 className="lp-cta-title">
                            Start Using Force POS<br />Today — It's Free!
                        </h2>
                        <p className="lp-cta-desc">
                            Join businesses already using Force POS. Every feature is unlocked and yours to use —
                            100% free, forever. No credit card, no trial period, no limits.
                        </p>
                        <div className="lp-cta-buttons">
                            <Link to="/signup" className="lp-btn lp-btn-gradient">
                                <i className="bi bi-rocket-takeoff"></i> Create Free Account
                            </Link>
                            <Link to="/login" className="lp-btn lp-btn-outline">
                                <i className="bi bi-box-arrow-in-right"></i> Sign In to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ FOOTER ============ */}
            <footer className="lp-footer">
                <div className="lp-container-wide">
                    <div className="lp-footer-grid">
                        <div className="lp-footer-brand">
                            <div className="lp-logo" style={{ marginBottom: 8 }}>
                                <div className="lp-logo-icon">
                                    <i className="bi bi-lightning-charge-fill"></i>
                                </div>
                                <div className="lp-logo-text">
                                    Force <span>POS</span>
                                </div>
                            </div>
                            <p>
                                A professional, enterprise-grade Point of Sale system built for modern retailers.
                                Manage your entire business from one powerful platform.
                            </p>
                        </div>
                        <div>
                            <h4>Product</h4>
                            <ul className="lp-footer-links">
                                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>Features</a></li>
                                <li><a href="#pos-showcase" onClick={(e) => { e.preventDefault(); scrollTo("pos-showcase"); }}>POS System</a></li>
                                <li><a href="#inventory-showcase" onClick={(e) => { e.preventDefault(); scrollTo("inventory-showcase"); }}>Inventory</a></li>
                                <li><a href="#reports-showcase" onClick={(e) => { e.preventDefault(); scrollTo("reports-showcase"); }}>Reports</a></li>
                                <li><a href="#tech" onClick={(e) => { e.preventDefault(); scrollTo("tech"); }}>Tech Stack</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Access</h4>
                            <ul className="lp-footer-links">
                                <li><Link to="/login">Sign In</Link></li>
                                <li><Link to="/signup">Create Account</Link></li>
                                <li><a href="#roles" onClick={(e) => { e.preventDefault(); scrollTo("roles"); }}>User Roles</a></li>
                                <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo("how-it-works"); }}>How It Works</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Support</h4>
                            <ul className="lp-footer-links">
                                <li><a href="#">Documentation</a></li>
                                <li><a href="#">API Reference</a></li>
                                <li><a href="#">Contact Us</a></li>
                                <li><a href="#">System Status</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="lp-footer-bottom">
                        <p>© {new Date().getFullYear()} Force POS. All rights reserved. Built with ⚡ for modern retail.</p>
                        <div className="lp-footer-socials">
                            <a href="#"><i className="bi bi-github"></i></a>
                            <a href="#"><i className="bi bi-twitter-x"></i></a>
                            <a href="#"><i className="bi bi-linkedin"></i></a>
                            <a href="#"><i className="bi bi-envelope"></i></a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* AI Custom Chat Widget */}
            <ChatWidget />
        </div>
    );
}
