import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogOut, ShieldAlert, User as UserIcon, Flame, Store, Utensils, Menu, X } from 'lucide-react';

export default function Navbar({ user, logout, cartCount }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <>
      <nav className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {/* Brand Logo - Redirects based on role */}
        <Link 
          to={user && user.role === 'admin' ? '/admin' : '/'} 
          onClick={closeMenu}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <div style={{
            background: 'var(--primary-grad)',
            padding: '0.4rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Flame size={22} color="white" />
          </div>
          <span style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.4rem',
            fontWeight: 800,
            background: 'linear-gradient(to right, #fff, #bbb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Bite<span style={{ color: 'var(--primary)', WebkitTextFillColor: 'initial' }}>Dash</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="nav-link">
            <Utensils size={16} color="var(--primary)" /> Explore Restaurants & Dishes
          </Link>
          {user && user.role === 'customer' && (
            <Link to="/my-orders" style={{ fontWeight: 500 }} className="nav-link">
              My Orders
            </Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin" className="admin-portal-btn">
              <ShieldAlert size={16} /> Admin Portal
            </Link>
          )}
        </div>

        {/* Desktop Profile & Controls */}
        <div className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {user ? (
            <>
              {/* Cart Button (Only for Customer) */}
              {user.role === 'customer' && (
                <Link to="/cart" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', position: 'relative' }}>
                  <ShoppingBag size={18} />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}>
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Profile Avatar / Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: user.role === 'admin' ? 'rgba(255, 75, 43, 0.15)' : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${user.role === 'admin' ? 'var(--primary)' : 'var(--border-color)'}`
                }}>
                  {user.role === 'admin' ? <Store size={16} color="var(--primary)" /> : <UserIcon size={16} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }} className="profile-info">
                  <span style={{ fontWeight: 600 }}>{user.name}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: user.role === 'admin' ? 'var(--primary)' : 'var(--success)',
                    textTransform: 'uppercase'
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button onClick={toggleMenu} className="hamburger-btn">
          <Menu size={20} />
        </button>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`mobile-drawer-overlay ${isOpen ? 'open' : ''}`} 
        onClick={closeMenu}
      ></div>

      {/* Mobile Drawer Navigation */}
      <div className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 800 }}>
            Bite<span style={{ color: 'var(--primary)' }}>Dash</span>
          </span>
          <button 
            onClick={closeMenu} 
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex' }}
          >
            <X size={22} />
          </button>
        </div>

        <div className="mobile-drawer-body">
          <Link 
            to="/" 
            onClick={closeMenu} 
            className="nav-link" 
            style={{ justifyContent: 'center', width: '100%' }}
          >
            <Utensils size={16} color="var(--primary)" /> Explore Foods
          </Link>
          
          {user && user.role === 'customer' && (
            <Link 
              to="/my-orders" 
              onClick={closeMenu} 
              className="nav-link" 
              style={{ justifyContent: 'center', width: '100%' }}
            >
              My Orders
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link 
              to="/admin" 
              onClick={closeMenu} 
              className="admin-portal-btn" 
              style={{ justifyContent: 'center', width: '100%' }}
            >
              <ShieldAlert size={16} /> Admin Portal
            </Link>
          )}
        </div>

        <div className="mobile-drawer-footer">
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: user.role === 'admin' ? 'rgba(255, 75, 43, 0.15)' : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${user.role === 'admin' ? 'var(--primary)' : 'var(--border-color)'}`
                }}>
                  {user.role === 'admin' ? <Store size={18} color="var(--primary)" /> : <UserIcon size={18} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: user.role === 'admin' ? 'var(--primary)' : 'var(--success)',
                    textTransform: 'uppercase'
                  }}>
                    {user.role}
                  </span>
                </div>

                {user.role === 'customer' && (
                  <Link 
                    to="/cart" 
                    onClick={closeMenu} 
                    className="btn btn-secondary" 
                    style={{ marginLeft: 'auto', padding: '0.5rem', position: 'relative' }}
                  >
                    <ShoppingBag size={18} />
                    {cartCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}
              </div>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ width: '100%', gap: '0.5rem', justifyContent: 'center' }}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link 
                to="/login" 
                onClick={closeMenu} 
                className="btn btn-secondary" 
                style={{ width: '100%', textAlign: 'center' }}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                onClick={closeMenu} 
                className="btn btn-primary" 
                style={{ width: '100%', textAlign: 'center' }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}



