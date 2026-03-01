import { useMemo, useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import POSCartItem from "../POSCartItem";

export default function POSCartList({ cart, products, currency, updateQty, apiBaseUrl, onClearCart }) {
    const [cartPage, setCartPage] = useState(1);
    const cartItemsPerPage = 5;

    const totalCartPages = Math.ceil(cart.length / cartItemsPerPage);

    const paginatedCart = useMemo(() => {
        const start = (cartPage - 1) * cartItemsPerPage;
        return cart.slice(start, start + cartItemsPerPage);
    }, [cart, cartPage]);

    // Go to first page when cart changes significantly (e.g. new item added)
    useEffect(() => {
        if (cartPage > totalCartPages && totalCartPages > 0) {
            setCartPage(totalCartPages);
        }
    }, [cart.length, totalCartPages]);

    return (
        <div className="flex-grow-1 d-flex flex-column overflow-hidden pos-cart-list-container">
            <div className="flex-grow-1 overflow-auto p-4 pos-cart-list">
                <div className="d-flex justify-content-end mb-2">
                    <button className="btn btn-sm btn-outline-danger border-0 p-0" onClick={onClearCart} title="Clear Cart">
                        <i className="bi bi-trash3"></i>
                    </button>
                </div>
                {cart.length > 0 ? (
                    paginatedCart.map(item => (
                        <POSCartItem
                            key={item.id}
                            item={item}
                            pInfo={products.find(p => p.id === item.id)}
                            currency={currency}
                            updateQty={updateQty}
                            apiBaseUrl={apiBaseUrl}
                        />
                    ))
                ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center opacity-50">
                        <i className="bi bi-cart-x mb-3" style={{ fontSize: '3rem' }}></i>
                        <div className="fs-6">Cart is empty</div>
                    </div>
                )}
            </div>

            {totalCartPages > 1 && (
                <div className="px-4 py-2 border-top border-secondary-subtle d-flex justify-content-between align-items-center bg-black-10">
                    <span className="x-small text-muted">Page <b>{cartPage}</b> of {totalCartPages}</span>
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="p-1 px-2 border-0"
                            disabled={cartPage === 1}
                            onClick={() => setCartPage(prev => prev - 1)}
                        >
                            <i className="bi bi-chevron-left x-small"></i>
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="p-1 px-2 border-0"
                            disabled={cartPage === totalCartPages}
                            onClick={() => setCartPage(prev => prev + 1)}
                        >
                            <i className="bi bi-chevron-right x-small"></i>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
