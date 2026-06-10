import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { ShieldAlert, DollarSign, ListOrdered, TrendingUp, Bell, PlusCircle, LayoutGrid, Plus } from 'lucide-react';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'menu'

  // Selected restaurant for menu addition
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  
  // Custom Restaurant form states (visible if selectedRestaurantId === 'custom')
  const [newRestName, setNewRestName] = useState('');
  const [newRestCuisine, setNewRestCuisine] = useState('');
  const [newRestAddress, setNewRestAddress] = useState('');
  const [newRestDesc, setNewRestDesc] = useState('');
  const [newRestLat, setNewRestLat] = useState('28.6304');
  const [newRestLng, setNewRestLng] = useState('77.2177');
  const [newRestImg, setNewRestImg] = useState('');

  // Form states for new food item
  const [foodName, setFoodName] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodCat, setFoodCat] = useState('Mains');
  const [customCategory, setCustomCategory] = useState(''); // visible if foodCat === 'custom'
  const [foodImg, setFoodImg] = useState('');
  const [isSubmittingFood, setIsSubmittingFood] = useState(false);

  useEffect(() => {
    // Check authentication and role
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    const initData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAdminOrders(),
        fetchRestaurants()
      ]);
      setLoading(false);
    };

    initData();

    // Connect to socket to receive incoming new order alerts
    const socket = io('srv-d8kij2b7uimc73b3roc0');
    socket.emit('join_admin');

    socket.on('new_order_alert', (newOrder) => {
      // Append alert banner
      setAlerts(prev => [newOrder, ...prev]);
      
      // Auto prepend order to list
      setOrders(prev => [newOrder, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchAdminOrders = async () => {
    try {
      const res = await fetch('srv-d8kij2b7uimc73b3roc0/api/orders/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to load dashboard orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('srv-d8kij2b7uimc73b3roc0/api/restaurants');
      const data = await res.json();
      setRestaurants(data);
      if (data.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(data[0]._id);
      } else if (data.length === 0) {
        setSelectedRestaurantId('custom');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`srv-d8kij2b7uimc73b3roc0/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Could not update status');
      
      // Update local state
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddFoodItem = async (e) => {
    e.preventDefault();
    setErrorAlerts('');
    
    if (!selectedRestaurantId) {
      alert('Please select a restaurant option.');
      return;
    }
    if (!foodName || !foodPrice) {
      alert('Please fill out Name and Price.');
      return;
    }

    setIsSubmittingFood(true);
    let targetRestaurantId = selectedRestaurantId;

    try {
      // 1. If 'custom' restaurant is selected, create the new restaurant first!
      if (selectedRestaurantId === 'custom') {
        if (!newRestName || !newRestCuisine || !newRestAddress) {
          throw new Error('Please fill out all custom restaurant fields (Name, Cuisine, Address).');
        }

        const restRes = await fetch('srv-d8kij2b7uimc73b3roc0/api/restaurants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            name: newRestName,
            description: newRestDesc,
            cuisine: newRestCuisine,
            address: newRestAddress,
            image: newRestImg,
            location: {
              lat: Number(newRestLat) || 28.6304,
              lng: Number(newRestLng) || 77.2177
            }
          })
        });

        const restData = await restRes.json();
        if (!restRes.ok) throw new Error(restData.message || 'Failed to create new restaurant');

        targetRestaurantId = restData._id;
        console.log('Created new restaurant with ID:', targetRestaurantId);

        // Reset new restaurant inputs
        setNewRestName('');
        setNewRestCuisine('');
        setNewRestAddress('');
        setNewRestDesc('');
        setNewRestImg('');
      }

      // Determine category (use custom input if chosen)
      const finalCategory = foodCat === 'custom' ? (customCategory || 'Custom') : foodCat;

      // 2. Add food item to target restaurant
      const res = await fetch(`srv-d8kij2b7uimc73b3roc0/api/restaurants/${targetRestaurantId}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: foodName,
          price: Number(foodPrice),
          description: foodDesc,
          category: finalCategory,
          image: foodImg
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add food item');

      alert('Successfully published! The food item has been added and is immediately visible to customers.');
      
      // Reset food form inputs
      setFoodName('');
      setFoodPrice('');
      setFoodDesc('');
      setFoodImg('');
      setCustomCategory('');

      // Refresh restaurant list to show updated menus
      await fetchRestaurants();
      
      // Switch select value to newly created restaurant if custom was used
      if (selectedRestaurantId === 'custom') {
        setSelectedRestaurantId(targetRestaurantId);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingFood(false);
    }
  };

  const setErrorAlerts = (msg) => {
    if (msg) console.error(msg);
  };

  // Find currently selected restaurant's menu
  const activeRestaurant = restaurants.find(r => r._id === selectedRestaurantId);

  // Metrics
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((acc, o) => acc + o.total, 0);
  const activeDeliveries = orders.filter(o => o.status === 'OutForDelivery' || o.status === 'Preparing').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container page-transition">
      
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert color="var(--primary)" /> Store Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time logistics, dashboard analytics, and restaurant menu editor
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`btn ${activeTab === 'orders' ? 'moving-gradient' : ''}`} 
            style={{
              background: activeTab === 'orders' ? undefined : 'var(--bg-surface)',
              color: activeTab === 'orders' ? 'white' : 'var(--text-main)',
              border: activeTab === 'orders' ? 'none' : '1px solid var(--border-color)',
              gap: '0.4rem',
              padding: '0.6rem 1.25rem'
            }}
          >
            <LayoutGrid size={18} /> Orders & Logistics
          </button>
          <button 
            onClick={() => setActiveTab('menu')} 
            className={`btn ${activeTab === 'menu' ? 'moving-gradient' : ''}`}
            style={{
              background: activeTab === 'menu' ? undefined : 'var(--bg-surface)',
              color: activeTab === 'menu' ? 'white' : 'var(--text-main)',
              border: activeTab === 'menu' ? 'none' : '1px solid var(--border-color)',
              gap: '0.4rem',
              padding: '0.6rem 1.25rem'
            }}
          >
            <PlusCircle size={18} /> Manage Menus
          </button>
        </div>
      </div>

      {/* Real-time Order Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {alerts.map((alertItem, idx) => (
            <div 
              key={idx} 
              className="glass" 
              style={{
                borderColor: 'var(--primary)',
                borderWidth: '2px',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-glow)',
                animation: 'pulse 2s infinite'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bell size={20} color="var(--primary)" />
                <div>
                  <strong style={{ color: 'white' }}>New Order Placed!</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    for ₹{alertItem.total}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setAlerts(prev => prev.filter((_, i) => i !== idx))} 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TABS RENDER */}
      {activeTab === 'orders' ? (
        <>
          {/* Metrics Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255, 75, 43, 0.12)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gross Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{totalRevenue}</div>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(41, 121, 255, 0.12)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--info)' }}>
                <ListOrdered size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Orders</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalOrders}</div>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(0, 230, 118, 0.12)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Deliveries</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeDeliveries}</div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Incoming Kitchen Orders</h3>
          
          {orders.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No orders placed in this store yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                background: 'var(--bg-surface)',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>Order ID</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>Restaurant</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>Delivery Address</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>Items</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>Bill Total</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }} className="admin-table-row">
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700 }}>
                        #{o._id.substring(0, 6).toUpperCase()}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {o.restaurant?.name || 'Restaurant'}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {o.deliveryAddress}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {o.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ₹{o.total}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span className={`badge ${
                          o.status === 'Placed' 
                            ? 'badge-primary' 
                            : o.status === 'Preparing' 
                              ? 'badge-info' 
                              : o.status === 'OutForDelivery' 
                                ? 'badge-warning' 
                                : 'badge-success'
                        }`}>
                          {o.status === 'OutForDelivery' ? 'Out For Delivery' : o.status}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        {o.status === 'Placed' && (
                          <button 
                            onClick={() => updateOrderStatus(o._id, 'Preparing')} 
                            className="btn btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            Accept & Prepare
                          </button>
                        )}
                        
                        {o.status === 'Preparing' && (
                          <button 
                            onClick={() => updateOrderStatus(o._id, 'OutForDelivery')} 
                            className="btn btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--warning)', color: 'var(--text-inverse)', boxShadow: 'none' }}
                          >
                            Dispatch Driver
                          </button>
                        )}

                        {o.status === 'OutForDelivery' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Driver Simulating...
                          </span>
                        )}

                        {o.status === 'Delivered' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* MENU MANAGEMENT TAB */
        <div className="grid-checkout">
          
          {/* Add Dish Form */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <PlusCircle size={22} color="var(--primary)" />
              <h2 style={{ fontSize: '1.35rem' }}>Menu Management</h2>
            </div>

            <form onSubmit={handleAddFoodItem} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Restaurant Select Dropdown with custom option */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Select Restaurant Target</label>
                <select
                  className="input-field"
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)' }}
                >
                  {restaurants.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.cuisine})</option>
                  ))}
                  <option value="custom" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    ✨ [Custom] Create & Add to New Restaurant...
                  </option>
                </select>
              </div>

              {/* Sub-Form: Add Custom Restaurant details if select is 'custom' */}
              {selectedRestaurantId === 'custom' && (
                <div style={{
                  background: 'rgba(255, 75, 43, 0.05)',
                  border: '1px solid rgba(255, 75, 43, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  animation: 'cardEntrance 0.4s ease'
                }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Plus size={16} /> New Restaurant Information
                  </h4>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Restaurant Name*</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Spice Route, Burger Hub"
                      value={newRestName}
                      onChange={(e) => setNewRestName(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Cuisine Category*</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Chinese, Fast Food, Italian"
                      value={newRestCuisine}
                      onChange={(e) => setNewRestCuisine(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Street Address*</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Connaught Place, Block C, Delhi"
                      value={newRestAddress}
                      onChange={(e) => setNewRestAddress(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Description (Optional)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Fine dining with amazing spices..."
                      value={newRestDesc}
                      onChange={(e) => setNewRestDesc(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Restaurant Image URL (Optional)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="https://images.unsplash.com/... (optional)"
                      value={newRestImg}
                      onChange={(e) => setNewRestImg(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Latitude Coordinate</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-field"
                        value={newRestLat}
                        onChange={(e) => setNewRestLat(e.target.value)}
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Longitude Coordinate</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-field"
                        value={newRestLng}
                        onChange={(e) => setNewRestLng(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Food Dish Details</h4>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Dish Name*</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Kadahi Paneer, Truffle Pizza"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Price (₹)*</label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    placeholder="250"
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Category</label>
                  <select
                    className="input-field"
                    value={foodCat}
                    onChange={(e) => setFoodCat(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-surface)' }}
                  >
                    <option value="Mains">Mains</option>
                    <option value="Starter">Starter</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Sides">Sides</option>
                    <option value="Drinks">Drinks</option>
                    <option value="custom" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                      ✨ [Custom] Enter custom category...
                    </option>
                  </select>
                </div>
              </div>

              {/* Custom Category text input if selected */}
              {foodCat === 'custom' && (
                <div className="input-group" style={{ marginBottom: 0, animation: 'cardEntrance 0.3s ease' }}>
                  <label className="input-label">Enter Custom Category Name*</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Chef Specials, Milkshakes"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </div>
              )}

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Describe the dish ingredients, spice level..."
                  value={foodDesc}
                  onChange={(e) => setFoodDesc(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Dish Image URL</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://images.unsplash.com/... (optional)"
                  value={foodImg}
                  onChange={(e) => setFoodImg(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFood}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem' }}
              >
                {isSubmittingFood ? 'Saving Information...' : 'Save & Publish Dish'}
              </button>

            </form>
          </div>

          {/* Current Restaurant Menu Preview */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              Current Menu Preview
            </h3>
            
            {selectedRestaurantId === 'custom' ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <p>You are creating a new custom restaurant.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Submit the form to publish the restaurant and your first menu item.
                </p>
              </div>
            ) : activeRestaurant ? (
              <div>
                <h4 style={{ color: 'var(--primary)', fontSize: '1.05rem', marginBottom: '1rem' }}>
                  {activeRestaurant.name} Menu ({activeRestaurant.menu.length} items)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {activeRestaurant.menu.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      No dishes in this restaurant's menu yet. Add one!
                    </p>
                  ) : (
                    activeRestaurant.menu.map((dish, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {dish.image && (
                          <img 
                            src={dish.image} 
                            alt={dish.name} 
                            style={{ width: '45px', height: '45px', borderRadius: '4px', objectFit: 'cover' }} 
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dish.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {dish.category} | {dish.description || 'No description'}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                          ₹{dish.price}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Please select a restaurant to see menu items.</p>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
