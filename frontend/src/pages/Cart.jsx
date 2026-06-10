import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, CreditCard, ShoppingBag, Truck } from 'lucide-react';

// Custom Map Marker for User location (Green Dot)
const userMarkerIcon = L.divIcon({
  html: `<div style="background-color: #00e676; width: 14px; height: 14px; border: 3px solid #0a0a0f; border-radius: 50%; box-shadow: 0 0 15px #00e676;"></div>`,
  className: 'user-map-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Custom component to handle click events on the Leaflet Map
function MapClickHandler({ setCoordinates, setAddress }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setCoordinates({ lat, lng });

      // Fetch textual address via reverse geocoding Nominatim
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          const formatted = parts.slice(0, 4).join(', ');
          setAddress(formatted);
        } else {
          setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch (err) {
        setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    }
  });
  return null;
}

export default function Cart({ user, cart, clearCart }) {
  const navigate = useNavigate();

  // Load coordinates from session storage (geolocation fallback) or default to Connaught Place
  const initialLat = parseFloat(sessionStorage.getItem('user_lat')) || 28.6304;
  const initialLng = parseFloat(sessionStorage.getItem('user_lng')) || 77.2177;
  const initialAddress = sessionStorage.getItem('user_address') || 'Radial Road 3, Connaught Place, New Delhi';

  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
  
  // Payment states
  const [cardName, setCardName] = useState(user ? user.name : '');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('***');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if guest
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  const cartItems = Object.values(cart);
  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '0.75rem' }}>Your Basket is Empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Add delicious foods from restaurants to checkout.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Browse Restaurants</button>
        </div>
      </div>
    );
  }

  // Calculate order metrics
  const restaurantId = cartItems[0].restaurantId;
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = 0; // Free delivery
  const total = subtotal;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      alert('Please select or write a delivery address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate premium payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          restaurantId,
          items: cartItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total,
          deliveryAddress: address,
          deliveryLocation: coordinates
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');

      clearCart();
      navigate(`/order-tracker/${data._id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container page-transition">
      <h1 className="section-title">Secure Checkout</h1>

      <div className="grid-checkout">
        
        {/* Left Side: Address Map Picker & Payment Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Step 1: Geolocation and Map Picker */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <MapPin size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.3rem' }}>Delivery Location</h2>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Click on the map to pin your exact delivery coordinate. Our real-time driver GPS tracker will target this pin.
            </p>

            {/* Leaflet Map */}
            <div style={{ height: '260px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <MapContainer 
                center={[initialLat, initialLng]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coordinates.lat, coordinates.lng]} icon={userMarkerIcon} />
                <MapClickHandler setCoordinates={setCoordinates} setAddress={setAddress} />
              </MapContainer>
            </div>

            {/* Selected Address Input */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Selected Address Text</label>
              <textarea
                required
                className="input-field"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Pin your address on the map or type it here..."
                style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Coordinates locked: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Step 2: Payment Details (Simulated Premium Stripe UI) */}
          <form onSubmit={handlePlaceOrder} className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <CreditCard size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.3rem' }}>Stripe Secured Payment</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Cardholder Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Card Number</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Expiry Date</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">CVC / CVV</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', marginTop: '1.25rem', gap: '0.5rem' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                    <span>Authorizing Payment...</span>
                  </>
                ) : (
                  <>
                    <Truck size={18} />
                    <span>Pay ₹{total} & Place Order</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Right Side: Order Summary */}
        <div className="glass-card" style={{
          position: 'sticky',
          top: '100px',
          padding: '2rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            Checkout Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {cartItems.map((item) => (
              <div key={item.id} className="flex-between" style={{ fontSize: '0.9rem' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    x{item.quantity}
                  </span>
                </div>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.95rem'
          }}>
            <div className="flex-between">
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--text-muted)' }}>Delivery Charge</span>
              <span style={{ color: 'var(--success)' }}>Free</span>
            </div>
            <div className="flex-between" style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              borderTop: '1px dotted var(--border-color)',
              paddingTop: '0.75rem',
              marginTop: '0.25rem'
            }}>
              <span>Total Bill</span>
              <span style={{ color: 'var(--primary)' }}>₹{total}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
