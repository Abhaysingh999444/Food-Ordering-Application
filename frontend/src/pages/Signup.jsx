import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, ShieldAlert, User, Mail, Lock, UserCheck } from 'lucide-react';

export default function Signup({ loginUser }) {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('srv-d8kij2b7uimc73b3roc0/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role: activeTab 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      alert('Account created successfully! Please log in to continue.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Animated Mesh Gradients */}
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div 
        className={`glass-card ${activeTab === 'admin' ? 'admin-glow-card' : 'customer-glow-card'}`}
        style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', zIndex: 10 }}
      >
        
        {/* Top Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            className={activeTab === 'admin' ? 'flame-float' : 'customer-flame-float'}
            style={{
              background: activeTab === 'admin' ? 'var(--primary-grad)' : 'var(--customer-grad)',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              boxShadow: activeTab === 'admin' ? '0 0 20px rgba(255, 75, 43, 0.3)' : '0 0 20px rgba(0, 230, 118, 0.3)',
              transition: 'background var(--transition-normal)'
            }}
          >
            <Flame size={28} color={activeTab === 'admin' ? 'white' : 'var(--bg-main)'} />
          </div>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '0.25rem', fontFamily: 'var(--font-title)' }}>
            Join Bite<span style={{ color: activeTab === 'admin' ? 'var(--primary)' : 'var(--customer-accent)', transition: 'color var(--transition-normal)' }}>Dash</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create a secure merchant or buyer key</p>
        </div>

        {/* Sliding Tab Buttons */}
        <div className="tab-slider-container">
          {/* Highlight pill that slides back and forth */}
          <div className={`tab-slider-bg slide-${activeTab}`}></div>
          
          <button
            type="button"
            onClick={() => { setActiveTab('customer'); setError(''); }}
            className={`tab-slider-btn ${activeTab === 'customer' ? 'active-customer' : ''}`}
          >
            <User size={16} /> Customer Signup
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`tab-slider-btn ${activeTab === 'admin' ? 'active-admin' : ''}`}
          >
            <ShieldAlert size={16} /> Admin Signup
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.12)',
            color: 'var(--error)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            border: '1px solid rgba(255, 23, 68, 0.2)',
            animation: 'cardEntrance 0.3s ease'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <UserCheck size={14} /> Full Name
            </label>
            <input
              type="text"
              required
              className={`input-field ${activeTab === 'admin' ? 'admin-focused' : 'customer-focused'}`}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              required
              className={`input-field ${activeTab === 'admin' ? 'admin-focused' : 'customer-focused'}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '1.75rem' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              required
              className={`input-field ${activeTab === 'admin' ? 'admin-focused' : 'customer-focused'}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-customer'}`}
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700
            }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: activeTab === 'admin' ? 'white' : 'var(--bg-main)' }}></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{ 
              color: activeTab === 'admin' ? 'var(--primary)' : 'var(--customer-accent)', 
              fontWeight: 700,
              transition: 'color var(--transition-normal)'
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
