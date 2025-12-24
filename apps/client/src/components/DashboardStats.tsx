import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useEffect, useState } from 'react';
import axios from 'axios';

const StatCard = ({ title, value, color, icon }: any) => (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: color + '20',
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
        }}>
            {icon}
        </div>
        <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
        </div>
    </div>
);

export const DashboardStats = () => {
    const products = useSelector((state: RootState) => state.inventory.products);
    const [stockValue, setStockValue] = useState<string>('0');

    useEffect(() => {
        const fetchStockValue = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get('http://localhost:3000/api/v1/analytics/stock-value', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const val = Number(res.data.total_retail_value || 0);
                setStockValue(`₹${(val / 1000).toFixed(1)}k`);
            } catch (err) {
                console.error("Failed to fetch stock value", err);
            }
        };
        fetchStockValue();
    }, []);

    // Calculate stats based on new Schema
    const uniqueProducts = new Set(products.map(p => p.product_name)).size;
    const totalInventoryCount = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    const lowStockCount = products.filter(p => (Number(p.quantity) || 0) < (p.low_stock_threshold || 5)).length;
    // const totalValue = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.selling_price) || 0)), 0);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard title="Unique Products" value={uniqueProducts} color="#3b82f6" icon="📦" />
            <StatCard title="Total Items" value={totalInventoryCount} color="#8b5cf6" icon="🔢" />
            <StatCard title="Low Stock Alerts" value={lowStockCount} color="#ef4444" icon="⚠️" />
            <StatCard title="Stock Value (Real)" value={stockValue} color="#10b981" icon="💰" />
        </div>
    );
};

