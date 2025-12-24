import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { setProducts, updateProductStock } from '../store/inventorySlice';
import type { RootState } from '../store';
import { FaEdit } from 'react-icons/fa';
import { io } from 'socket.io-client';

export const StockTable = () => {
    const dispatch = useDispatch();
    const products = useSelector((state: RootState) => state.inventory.products);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [adjustQty, setAdjustQty] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        const fetchInventory = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:3000/api/v1/inventory', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                dispatch(setProducts(res.data));
            } catch (e) {
                console.error(e);
            }
        };
        fetchInventory();

        // Socket Listener
        const socket = io('http://localhost:3000');
        socket.on('stock_update', () => {
            // For simplicity, just refetch all. Optimized approach would act on payload.
            fetchInventory();
        });

        return () => {
            socket.disconnect();
        };
    }, [dispatch]);

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/api/v1/inventory/update', {
                variantId: selectedVariant.variant_id,
                quantity: Number(adjustQty),
                reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            dispatch(updateProductStock({
                variantId: selectedVariant.variant_id,
                quantity: res.data.newQuantity
            }));

            alert('Stock Updated Successfully');
            setSelectedVariant(null);
            setAdjustQty('');
            setReason('');
        } catch (err) {
            alert('Failed to update stock');
            console.error(err);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '2rem' }}>Live Inventory</h2>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>SKU</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Product</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Variant</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Stock</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p: any) => (
                            <tr key={p.variant_id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#94a3b8' }}>{p.sku}</td>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{p.product_name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ background: '#3b82f6', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', marginRight: '0.5rem' }}>
                                        {p.size}
                                    </span>
                                    {p.color && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.color}</span>}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: p.quantity < 5 ? '#ef4444' : '#10b981'
                                    }}>
                                        {p.quantity}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        className="btn"
                                        style={{ padding: '0.4rem', fontSize: '0.8rem', background: '#334155' }}
                                        onClick={() => setSelectedVariant(p)}
                                    >
                                        <FaEdit /> Adjust
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Adjustment Modal */}
            {selectedVariant && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <form onSubmit={handleAdjust} className="glass-panel" style={{ padding: '2rem', width: '400px', background: '#1e293b' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Adjust Stock: {selectedVariant.sku}</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">Quantity Change (+/-)</label>
                            <input
                                className="input-field"
                                type="number"
                                placeholder="e.g. 10 or -5"
                                value={adjustQty}
                                onChange={e => setAdjustQty(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Reason</label>
                            <select className="input-field" value={reason} onChange={e => setReason(e.target.value)} required>
                                <option value="">Select Reason</option>
                                <option value="New Stock">Received New Stock</option>
                                <option value="Damaged">Damaged / Expired</option>
                                <option value="Correction">Inventory Correction</option>
                                <option value="Return">Customer Return</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setSelectedVariant(null)} className="btn" style={{ background: 'transparent' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Update</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
