import { useState } from 'react';
import axios from 'axios';

export const OrderForm = () => {
    const [type, setType] = useState<'SALE' | 'PURCHASE'>('SALE');
    const [variantId, setVariantId] = useState('');
    const [quantity, setQuantity] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:3000/api/v1/orders', {
                type,
                items: [{ variantId, quantity: Number(quantity) }]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Order Placed Successfully!');
        } catch (err: any) {
            alert('Order Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Create Order</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Order Type</label>
                    <select
                        className="input-field"
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        style={{ background: 'rgba(15, 23, 42, 0.5)', color: 'white' }}
                    >
                        <option value="SALE">Sale (Decrease Stock)</option>
                        <option value="PURCHASE">Purchase (Increase Stock)</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Variant ID</label>
                    <input
                        className="input-field"
                        placeholder="e.g. uuid..."
                        value={variantId}
                        onChange={e => setVariantId(e.target.value)}
                        required
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Quantity</label>
                    <input
                        className="input-field"
                        type="number"
                        placeholder="e.g. 5"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        required
                    />
                </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {type === 'SALE' ? '📉 Place Sale Order' : '📈 Place Purchase Order'}
            </button>
        </form>
    );
};
