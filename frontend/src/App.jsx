import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import RestaurantDetails from './pages/RestaurantDetails';
import Cart from './pages/Cart';
import OrderTracker from './pages/OrderTracker';
import MyOrders from './pages/MyOrders';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Initial State Load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const savedCart = localStorage.getItem('cart');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  // Sync Cart changes to local storage
  const saveCartToStorage = (newCart) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  // 2. Auth Helper Methods
  const loginUser = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    setUser(null);
    setCart({});
  };

  // Switch role during testing
  const changeRole = async (newRole) => {
    if (!user) return;
    try {
      const res = await fetch('srv-d8kij2b7uimc73b3roc0/api/auth/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Save new credentials
      loginUser(data.token, data.user);
      alert(`Role switched to: ${newRole.toUpperCase()} successfully!`);
    } catch (err) {
      console.error('Failed to change role:', err);
      // Fallback local update if network issue
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // 3. Cart Helper Methods
  const addToCart = (dish, restaurantId) => {
    const newCart = { ...cart };
    const dishId = dish._id || dish.name;

    // Check if adding from a different restaurant
    const existingItems = Object.values(newCart);
    if (existingItems.length > 0 && existingItems[0].restaurantId !== restaurantId) {
      const confirmClear = window.confirm(
        'You already have items in your basket from another restaurant. Clear basket and start a new order?'
      );
      if (confirmClear) {
        const item = { id: dishId, name: dish.name, price: dish.price, quantity: 1, restaurantId };
        saveCartToStorage({ [dishId]: item });
      }
      return;
    }

    if (newCart[dishId]) {
      newCart[dishId].quantity += 1;
    } else {
      newCart[dishId] = {
        id: dishId,
        name: dish.name,
        price: dish.price,
        quantity: 1,
        restaurantId
      };
    }
    saveCartToStorage(newCart);
  };

  const removeFromCart = (dishId) => {
    const newCart = { ...cart };
    if (!newCart[dishId]) return;

    if (newCart[dishId].quantity > 1) {
      newCart[dishId].quantity -= 1;
    } else {
      delete newCart[dishId];
    }
    saveCartToStorage(newCart);
  };

  const clearCart = () => {
    saveCartToStorage({});
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        
        {/* Navigation header */}
        <Navbar user={user} logout={logout} cartCount={cartCount} />
        
        {/* Application Page Routing */}
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/restaurant/:id" element={
            <RestaurantDetails 
              cart={cart} 
              addToCart={addToCart} 
              removeFromCart={removeFromCart} 
              clearCart={clearCart} 
            />
          } />
          
          <Route path="/cart" element={
            user ? (
              <Cart user={user} cart={cart} clearCart={clearCart} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/order-tracker/:id" element={
            user ? (
              <OrderTracker />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/my-orders" element={
            user ? (
              <MyOrders user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/admin" element={
            user && user.role === 'admin' ? (
              <AdminDashboard user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/login" element={
            !user ? <Login loginUser={loginUser} /> : <Navigate to="/" replace />
          } />
          
          <Route path="/signup" element={
            !user ? <Signup loginUser={loginUser} /> : <Navigate to="/" replace />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
