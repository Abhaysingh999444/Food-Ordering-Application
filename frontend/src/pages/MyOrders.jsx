import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Clock, Calendar, AlertCircle } from 'lucide-react';

export default function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('srv-d8kij2b7uimc73b3roc0/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Could not fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container page-transition" style={{ maxWidth: '850px' }}>
      <h1 className="section-title">Order History</h1>

      {orders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <AlertCircle size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You haven't placed any orders yet.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Order Now</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={order._id} 
                className="glass-card" 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  gap: '1.5rem',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>
                      {order.restaurant?.name || 'Restaurant Partner'}
                    </h3>
                    <span className={`badge ${
                      order.status === 'Delivered' 
                        ? 'badge-success' 
                        : order.status === 'OutForDelivery' 
                          ? 'badge-warning' 
                          : 'badge-primary'
                    }`}>
                      {order.status === 'OutForDelivery' ? 'Out For Delivery' : order.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={14} /> {dateStr}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} /> Total Items: {order.items.reduce((a,c) => a+c.quantity, 0)}
                    </span>
                  </div>

                  {/* Items list preview */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount Paid</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{order.total}
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/order-tracker/${order._id}`)} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.6rem 1rem', gap: '0.4rem', fontSize: '0.85rem' }}
                  >
                    <Eye size={16} /> Track
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
