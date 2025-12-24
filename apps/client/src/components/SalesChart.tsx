import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';

export const SalesChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:3000/api/v1/analytics/daily-sales', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Format date for chart
                const formattedData = res.data.map((item: any) => ({
                    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
                    sales: Number(item.total_revenue)
                })).reverse(); // API returns DESC, chart wants ASC usually
                setData(formattedData);
            } catch (err) {
                console.error("Failed to fetch sales data", err);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="glass-panel" style={{ padding: '2rem', height: '400px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '2rem' }}>Weekly Sales Overview</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

