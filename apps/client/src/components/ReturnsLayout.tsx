
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const ReturnsLayout = () => {
    const [invoiceNum, setInvoiceNum] = useState('');
    const [saleData, setSaleData] = useState<any>(null);
    const [selectedItems, setSelectedItems] = useState<any>({});
    const navigate = useNavigate();

    const fetchInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:3000/api/v1/sales/${invoiceNum}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSaleData(res.data);
            setSelectedItems({});
        } catch (err: any) {
            alert(err.response?.data?.message || 'Invoice not found');
            setSaleData(null);
        }
    };

    const handleItemToggle = (itemId: string, maxQty: number, variantId: string) => {
        setSelectedItems((prev: any) => {
            if (prev[itemId]) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [itemId]: { variantId, quantity: 1, condition: 'RESELLABLE', refundAmount: 0, maxQty }
            };
        });
    };

    const updateItem = (itemId: string, field: string, value: any) => {
        setSelectedItems((prev: any) => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const processReturn = async () => {
        const itemsToReturn = Object.values(selectedItems).map((item: any) => ({
            variantId: item.variantId,
            quantity: Number(item.quantity),
            condition: item.condition,
            refundAmount: Number(item.refundAmount)
        }));

        if (itemsToReturn.length === 0) return alert('No items selected');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/v1/returns', {
                saleId: saleData.sale.id,
                items: itemsToReturn
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Return Processed Successfully!');
            setSaleData(null);
            setInvoiceNum('');
            setInvoiceNum('');
        } catch (err: any) {
            console.error(err);
            alert('Return Failed: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '2rem', height: '100vh', background: '#0f172a', color: 'white', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Returns & Exchanges</h1>
                <button className="btn" onClick={() => navigate('/dashboard')} style={{ background: '#3b82f6', color: 'white' }}>Back to Dashboard</button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <form onSubmit={fetchInvoice} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        className="input-field"
                        placeholder="Enter Invoice Number (e.g. INV-173...)"
                        value={invoiceNum}
                        onChange={e => setInvoiceNum(e.target.value)}
                        style={{ maxWidth: '400px', margin: 0 }}
                    />
                    <button type="submit" className="btn btn-primary">Find Invoice</button>
                </form>
            </div>

            {saleData && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Invoice: {saleData.sale.invoice_number}</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Customer: {saleData.sale.customer_name || 'N/A'}</p>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                                <th style={{ padding: '1rem' }}>Select</th>
                                <th style={{ padding: '1rem' }}>Product</th>
                                <th style={{ padding: '1rem' }}>Sold Qty</th>
                                <th style={{ padding: '1rem' }}>Return Qty</th>
                                <th style={{ padding: '1rem' }}>Condition</th>
                                <th style={{ padding: '1rem' }}>Refund Amt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {saleData.items.map((item: any) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!selectedItems[item.id]}
                                            onChange={() => handleItemToggle(item.id, item.quantity, item.variant_id)}
                                            style={{ transform: 'scale(1.5)' }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>{item.product_name} ({item.size})</td>
                                    <td style={{ padding: '1rem' }}>{item.quantity}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {selectedItems[item.id] && (
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.quantity}
                                                value={selectedItems[item.id].quantity}
                                                onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                className="input-field"
                                                style={{ width: '80px', margin: 0, padding: '0.5rem' }}
                                            />
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {selectedItems[item.id] && (
                                            <select
                                                value={selectedItems[item.id].condition}
                                                onChange={e => updateItem(item.id, 'condition', e.target.value)}
                                                className="input-field"
                                                style={{ margin: 0, padding: '0.5rem' }}
                                            >
                                                <option value="RESELLABLE">Resellable</option>
                                                <option value="DEFECTIVE">Defective</option>
                                            </select>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {selectedItems[item.id] && (
                                            <input
                                                type="number"
                                                value={selectedItems[item.id].refundAmount}
                                                onChange={e => updateItem(item.id, 'refundAmount', e.target.value)}
                                                className="input-field"
                                                style={{ width: '100px', margin: 0, padding: '0.5rem' }}
                                                placeholder="Refund"
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ textAlign: 'right' }}>
                        <button className="btn btn-primary" onClick={processReturn} style={{ background: '#ef4444' }}>
                            Process Return
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
