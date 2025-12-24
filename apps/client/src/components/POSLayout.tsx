import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { addToCart, removeFromCart, updateQuantity, setCustomer, clearCart } from '../store/posSlice';
import axios from 'axios';
import { FaSearch, FaTrash, FaMoneyBillWave } from 'react-icons/fa';

export const POSLayout = () => {
    const dispatch = useDispatch();
    const { cart, totals, customer } = useSelector((state: RootState) => state.pos);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Search Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2) {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:3000/api/v1/products/search?q=${searchQuery}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSearchResults(res.data);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to clear the cart?')) {
            dispatch(clearCart());
        }
    };

    const printInvoice = (saleData: any, items: any[], total: number) => {
        const win = window.open('', '', 'width=800,height=600');
        if (!win) return;

        const html = `
            <html>
            <head>
                <title>Invoice ${saleData.invoiceNumber}</title>
                <style>
                    body { font-family: monospace; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { text-align: left; padding: 5px; border-bottom: 1px dashed #000; }
                    .total { text-align: right; font-weight: bold; font-size: 1.2rem; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>SPORTS RETAIL STORE</h2>
                    <p>Phone: +91 98765 43210</p>
                    <p>Invoice: ${saleData.invoiceNumber}</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                </div>
                <table>
                    <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                    ${items.map(i => `
                        <tr>
                            <td>${i.productName} (${i.size})</td>
                            <td>${i.quantity}</td>
                            <td>${i.price}</td>
                            <td>${(i.price * i.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
                <div class="total">
                    TOTAL: ₹${total.toFixed(2)}
                </div>
                <div style="text-align: center; margin-top: 40px;">
                    Thank you for shopping!
                </div>
                <script>
                    window.print();
                    window.onafterprint = function() { window.close(); }
                </script>
            </body>
            </html>
        `;

        win.document.write(html);
        win.document.close();
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('Cart is empty!');

        try {
            const token = localStorage.getItem('token');
            const payload = {
                items: cart.map(item => ({
                    variant_id: item.variantId,
                    quantity: item.quantity
                })),
                paymentMode: 'CASH', // Default for now
                customerName: customer.name || 'Walk-in'
            };

            const res = await axios.post('http://localhost:3000/api/v1/pos/sale', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            printInvoice(res.data, cart, totals.total);
            dispatch(clearCart());
        } catch (err: any) {
            console.error(err);
            alert('Checkout Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', color: 'white' }}>
            {/* Header / Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1.5rem', background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📦</span> Sports Retail POS
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Quick Admin Access - In real app, verify role from token */}
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="btn"
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white' }}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
                        className="btn"
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                    >
                        Log Out
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', flex: 1, overflow: 'hidden' }}>

                {/* LEFT: Product Grid & Search */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Scan Barcode or Search Product (F1)..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    background: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1.1rem'
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', overflowY: 'auto' }}>
                        {searchResults.map((variant: any) => (
                            <div
                                key={variant.variant_id}
                                onClick={() => dispatch(addToCart({
                                    variantId: variant.variant_id,
                                    productName: variant.product_name,
                                    sku: variant.sku,
                                    size: variant.size,
                                    color: variant.color,
                                    price: parseFloat(variant.selling_price),
                                    gstRate: parseFloat(variant.gst_rate),
                                    quantity: 1
                                }))}
                                style={{
                                    background: '#1e293b',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'transform 0.1s',
                                    position: 'relative'
                                }}
                                className="hover:scale-95"
                            >
                                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{variant.sku}</div>
                                <div style={{ fontWeight: 600, margin: '0.5rem 0', minHeight: '3rem' }}>{variant.product_name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ background: '#3b82f6', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        {variant.size}
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                                        ₹{variant.selling_price}
                                    </div>
                                </div>
                                {variant.stock < 5 && (
                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.75rem', color: '#ef4444' }}>
                                        Low: {variant.stock}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Cart & Checkout */}
                <div style={{ display: 'flex', flexDirection: 'column', background: '#1e293b' }}>
                    {/* Customer Info */}
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Customer Name (Optional)"
                                value={customer.name}
                                onChange={e => dispatch(setCustomer({ ...customer, name: e.target.value }))}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                            />
                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={customer.phone}
                                onChange={e => dispatch(setCustomer({ ...customer, phone: e.target.value }))}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                            />
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'left' }}>
                                <tr>
                                    <th style={{ padding: '0.5rem' }}>Item</th>
                                    <th style={{ padding: '0.5rem' }}>Qty</th>
                                    <th style={{ padding: '0.5rem' }}>Price</th>
                                    <th style={{ padding: '0.5rem' }}>Total</th>
                                    <th style={{ padding: '0.5rem' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map(item => (
                                    <tr key={item.variantId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem 0.5rem' }}>
                                            <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.size} / {item.color}</div>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', borderRadius: '6px', padding: '0.2rem' }}>
                                                <button onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity - 1 }))} style={{ color: 'white', width: '24px', textAlign: 'center' }}>-</button>
                                                <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                <button onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity + 1 }))} style={{ color: 'white', width: '24px', textAlign: 'center' }}>+</button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>{item.price}</td>
                                        <td style={{ padding: '0.5rem' }}>{(item.price * item.quantity).toFixed(2)}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <button onClick={() => dispatch(removeFromCart(item.variantId))} style={{ color: '#ef4444' }}><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div style={{ padding: '2rem', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94a3b8' }}>
                            <span>Subtotal</span>
                            <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: '#94a3b8' }}>
                            <span>Tax (GST)</span>
                            <span>₹{totals.tax.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            <span>Total Pay</span>
                            <span>₹{totals.total.toFixed(2)}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="btn" onClick={handleCancel} style={{ background: '#1e293b', justifyContent: 'center', padding: '1rem' }}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleCheckout} style={{ justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }}>
                                <FaMoneyBillWave /> Pay Now (F2)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
