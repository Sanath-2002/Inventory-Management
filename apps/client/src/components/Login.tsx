import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:3000/api/v1/login', { username, password });
            localStorage.setItem('token', res.data.accessToken);
            navigate('/pos');
        } catch (err: any) {
            console.error(err);
            alert('Login Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #3b82f620 0%, transparent 40%), radial-gradient(circle at bottom left, #10b98120 0%, transparent 40%)',
            color: 'white'
        }}>
            <form onSubmit={handleLogin} className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', background: '#1e293b' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Sports Retail POS</h1>
                    <p style={{ color: '#94a3b8' }}>Sign in to start billing</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#94a3b8' }}>Username</label>
                    <input
                        className="input-field"
                        type="text"
                        placeholder="e.g. admin or staff01"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#94a3b8' }}>Password</label>
                    <input
                        className="input-field"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Sign In →
                </button>
            </form>
        </div>
    );
};
