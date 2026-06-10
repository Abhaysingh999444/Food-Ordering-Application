import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, ShoppingBag, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function RestaurantDetails({ cart, addToCart, removeFromCart, clearCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantDetails();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      const res = await fetch(`srv-d8kij2b7uimc73b3roc0/api/restaurants/${id}`);
      if (!res.ok) throw new Error('Failed to load restaurant details');
      const data = await res.json();
      setRestaurant(data);
    } catch (err) {
      console.error(err);
      navigate('/');
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

  // Group menu items by category
  const categories = restaurant.menu.reduce((acc, item) => {
    const cat = item.category || 'Mains';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Calculate cart stats
  const cartItems = Object.values(cart).filter(item => item.restaurantId === id);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="container page-transition">
      {/* Back Button */}
      <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginBottom: '1.5rem', gap: '0.4rem', padding: '0.5rem 1rem' }}>
        <ArrowLeft size={16} /> Back to Browse
      </button>

      {/* Restaurant Header */}
      <div className="glass" style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        marginBottom: '2.5rem'
      }}>
        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
          <img 
            src={restaurant.image} 
            alt={restaurant.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          {/* Shadow Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.3) 100%)'
          }}></div>

          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '2rem',
            right: '2rem'
          }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
              {restaurant.cuisine}
            </span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {restaurant.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', marginBottom: '1rem' }}>
              {restaurant.description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={16} fill="var(--accent)" color="var(--accent)" />
                <span style={{ fontWeight: 700 }}>{restaurant.rating.toFixed(1)} Rating</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                <MapPin size={16} color="var(--primary)" />
                <span>{restaurant.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Menu grid + Cart Sidebar */}
      <div className={`grid-details ${cartItems.length === 0 ? 'no-cart' : ''}`}>
        {/* Menu Section */}
        <div>
          {Object.keys(categories).map((categoryName) => (
            <div key={categoryName} style={{ marginBottom: '2.5rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem',
                marginBottom: '1.25rem',
                color: 'var(--primary)'
              }}>
                {categoryName}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {categories[categoryName].map((dish) => {
                  const cartItem = cart[dish._id || dish.name];
                  const qty = cartItem ? cartItem.quantity : 0;

                  return (
                    <div 
                      key={dish._id || dish.name} 
                      className="glass-card" 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1.5rem',
                        alignItems: 'center',
                        padding: '1.25rem'
                      }}
                    >
                      {/* Left: Info */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{dish.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                          {dish.description}
                        </p>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                          ₹{dish.price}
                        </span>
                      </div>

                      {/* Right: Image and Add Button */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        {dish.image && (
                          <img 
                            src={dish.image} 
                            alt={dish.name} 
                            style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} 
                          />
                        )}
                        
                        {qty > 0 ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--primary-grad)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.25rem 0.5rem',
                            gap: '0.75rem'
                          }}>
                            <button 
                              onClick={() => removeFromCart(dish._id || dish.name)} 
                              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{qty}</span>
                            <button 
                              onClick={() => addToCart(dish, id)} 
                              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(dish, id)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', gap: '0.25rem' }}
                          >
                            <Plus size={14} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Sidebar (shown only if items are in the cart) */}
        {cartItems.length > 0 && (
          <div className="glass-card" style={{
            position: 'sticky',
            top: '100px',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(20,20,30,0.85)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <ShoppingBag size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.2rem' }}>Your Basket</h3>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>₹{item.price} each</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => removeFromCart(item.id)} className="btn btn-secondary btn-icon" style={{ width: '26px', height: '26px', borderRadius: '4px' }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => addToCart(item, id)} className="btn btn-secondary btn-icon" style={{ width: '26px', height: '26px', borderRadius: '4px' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div className="flex-between">
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-muted)' }}>Delivery Charge</span>
                <span style={{ color: 'var(--success)' }}>Free</span>
              </div>
              <div className="flex-between" style={{ fontSize: '1.1rem', fontWeight: 700, borderTop: '1px dotted var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>₹{cartSubtotal}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button 
              onClick={() => navigate('/cart')} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            >
              Proceed to Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
