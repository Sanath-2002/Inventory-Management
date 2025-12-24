import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Login } from './components/Login';
import { POSLayout } from './components/POSLayout';
import { DashboardStats } from './components/DashboardStats';
import { SalesChart } from './components/SalesChart';
import { StockTable } from './components/StockTable';
import { ProductForm } from './components/ProductForm';
import { OrderForm } from './components/OrderForm';
import { ReturnsLayout } from './components/ReturnsLayout';
import { useState } from 'react';


const Dashboard = () => {
  const [showProductForm, setShowProductForm] = useState(false);

  return (
    <div style={{ padding: '2rem', height: '100vh', overflowY: 'auto', background: '#0f172a', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Admin Dashboard</h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/pos" className="btn" style={{ background: '#1e293b', color: 'white' }}>Go to POS</Link>
            <Link to="/returns" className="btn" style={{ background: '#1e293b', color: 'white' }}>Returns</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowProductForm(true)} className="btn btn-primary">+ Add Product</button>
        </div>
      </div>

      <DashboardStats />

      <div style={{ margin: '2rem 0' }}>
        <SalesChart />
      </div>

      {showProductForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%' }}>
            <ProductForm onClose={() => setShowProductForm(false)} />
          </div>
        </div>
      )}

      <StockTable />

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Purchase Orders (Inward)</h2>
        <OrderForm />
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div style={{ height: '100vh', background: '#0f172a' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pos" element={<POSLayout />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/returns" element={<ReturnsLayout />} />
          <Route path="/" element={<Navigate to="/pos" />} />
          <Route path="*" element={<Navigate to="/pos" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
