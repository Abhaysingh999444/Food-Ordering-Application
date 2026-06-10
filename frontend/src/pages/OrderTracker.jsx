import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import { Compass, ShoppingBag, Truck, CheckCircle, Package } from 'lucide-react';

// Custom Markers
const restaurantMarkerIcon = L.divIcon({
  html: `<div style="background-color: #ff4b2b; width: 16px; height: 16px; border: 3px solid #0a0a0f; border-radius: 50%; box-shadow: 0 0 15px #ff4b2b;"></div>`,
  className: 'rest-map-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const customerMarkerIcon = L.divIcon({
  html: `<div style="background-color: #00e676; width: 16px; height: 16px; border: 3px solid #0a0a0f; border-radius: 50%; box-shadow: 0 0 15px #00e676;"></div>`,
  className: 'cust-map-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const driverMarkerIcon = L.divIcon({
  html: `<div class="driver-pulse-marker" style="background-color: #ffb300; width: 20px; height: 20px; border: 3px solid #0a0a0f; border-radius: 50%; box-shadow: 0 0 20px #ffb300; display:flex; align-items:center; justify-content:center; font-size:10px;">🛵</div>`,
  className: 'driver-map-marker',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

// Component to dynamically fit map boundaries to show all active markers
function MapBoundsHandler({ restaurantLoc, customerLoc, driverLoc }) {
  const map = useMap();
  useEffect(() => {
    if (!restaurantLoc || !customerLoc) return;
    
    const bounds = [
      [restaurantLoc.lat, restaurantLoc.lng],
      [customerLoc.lat, customerLoc.lng]
    ];
    if (driverLoc) {
      bounds.push([driverLoc.lat, driverLoc.lng]);
    }
    
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [restaurantLoc, customerLoc, driverLoc, map]);
  return null;
}

export default function OrderTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch current order state
    fetchOrderDetails();

    // 2. Establish Socket.io connection for real-time alerts
    const socket = io('https://food-ordering-application-h8fj.onrender.com');
    socket.emit('join_order', id);

    // Receive order status adjustments
    socket.on('order_status_update', (data) => {
      if (data.orderId === id) {
        setOrder(prev => ({
          ...prev,
          status: data.status,
          driverLocation: data.order.driverLocation
        }));
        if (data.status === 'Delivered') {
          setDriverLoc(null);
        }
      }
    });

    // Receive driver GPS changes
    socket.on('driver_location_update', (data) => {
      if (data.orderId === id) {
        setDriverLoc(data.driverLocation);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`https://food-ordering-application-h8fj.onrender.com/api/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve order');
      const data = await res.json();
      setOrder(data);
      if (data.driverLocation) {
        setDriverLoc(data.driverLocation);
      }
    } catch (err) {
      console.error(err);
      navigate('/my-orders');
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

  const statusSteps = [
    { label: 'Placed', icon: <ShoppingBag size={18} />, desc: 'We have received your order' },
    { label: 'Preparing', icon: <Package size={18} />, desc: 'Chef is baking your delicious meal' },
    { label: 'OutForDelivery', icon: <Truck size={18} />, desc: 'Driver is on their way to you' },
    { label: 'Delivered', icon: <CheckCircle size={18} />, desc: 'Enjoy your hot meal!' }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.label === order.status);
  
  // Coordinates
  const restaurantLoc = order.restaurant?.location;
  const customerLoc = order.deliveryLocation;

  return (
    <div className="container page-transition">
      <h1 className="section-title">Live Order Tracker</h1>

      <div className="grid-tracker">
        
        {/* Left Column: Order Stats & Progress Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Summary Card */}
          <div className="glass-card">
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
              Order ID: #{order._id.substring(0, 8).toUpperCase()}
            </span>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>
              {order.restaurant?.name || 'Restaurant Partner'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Preparing from: {order.restaurant?.address}
            </p>

            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>
                    {item.name} <strong style={{ color: 'var(--text-main)' }}>x{item.quantity}</strong>
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex-between" style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.5rem', borderTop: '1px dotted var(--border-color)', paddingTop: '0.5rem' }}>
                <span>Amount Paid</span>
                <span style={{ color: 'var(--primary)' }}>₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Real-time Timeline Tracker */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Delivery Progress</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
              
              {/* Vertical line connecting steps */}
              <div style={{
                position: 'absolute',
                left: '21px',
                top: '20px',
                bottom: '20px',
                width: '2px',
                background: 'rgba(255,255,255,0.06)',
                zIndex: 0
              }}></div>

              {/* Progress-colored vertical line */}
              {currentStepIndex > 0 && (
                <div style={{
                  position: 'absolute',
                  left: '21px',
                  top: '20px',
                  height: `${(currentStepIndex / (statusSteps.length - 1)) * 82}%`,
                  width: '2px',
                  background: 'var(--primary-grad)',
                  zIndex: 1,
                  transition: 'height 0.8s ease'
                }}></div>
              )}

              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isActive = index === currentStepIndex;

                return (
                  <div key={step.label} style={{ display: 'flex', gap: '1.25rem', zIndex: 2, position: 'relative' }}>
                    
                    {/* Circle icon */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: isActive 
                        ? 'var(--primary-grad)' 
                        : isCompleted 
                          ? 'rgba(0, 230, 118, 0.15)' 
                          : 'var(--bg-surface-hover)',
                      color: isActive 
                        ? 'white' 
                        : isCompleted 
                          ? 'var(--success)' 
                          : 'var(--text-muted)',
                      border: isActive 
                        ? 'none' 
                        : `1px solid ${isCompleted ? 'var(--success)' : 'var(--border-color)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                      transition: 'all 0.5s ease'
                    }}>
                      {step.icon}
                    </div>

                    {/* Step info */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '0.95rem',
                        color: isActive 
                          ? 'var(--primary)' 
                          : isCompleted 
                            ? 'var(--text-main)' 
                            : 'var(--text-muted)'
                      }}>
                        {step.label === 'OutForDelivery' ? 'Out For Delivery' : step.label}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {step.desc}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>

        {/* Right Column: Leaflet Live Map */}
        <div className="glass-card" style={{ padding: '1rem', height: '520px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem' }}>Live GPS Tracking</h3>
            </div>
            
            {order.status === 'OutForDelivery' && (
              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                Driver Active
              </span>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {restaurantLoc && customerLoc ? (
              <MapContainer 
                center={[restaurantLoc.lat, restaurantLoc.lng]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Restaurant Pin */}
                <Marker position={[restaurantLoc.lat, restaurantLoc.lng]} icon={restaurantMarkerIcon} />
                
                {/* Customer Pin */}
                <Marker position={[customerLoc.lat, customerLoc.lng]} icon={customerMarkerIcon} />

                {/* Driver Pin */}
                {driverLoc && (
                  <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverMarkerIcon} />
                )}

                {/* Drawing a line connecting restaurant to user */}
                <Polyline 
                  positions={[
                    [restaurantLoc.lat, restaurantLoc.lng],
                    [customerLoc.lat, customerLoc.lng]
                  ]} 
                  color="var(--primary)" 
                  dashArray="6, 8" 
                  weight={3.5}
                  opacity={0.6}
                />

                {/* Fit View bounds helper */}
                <MapBoundsHandler 
                  restaurantLoc={restaurantLoc} 
                  customerLoc={customerLoc} 
                  driverLoc={driverLoc} 
                />

              </MapContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                GPS coordinates missing or mapping unavailable.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4b2b' }}></div>
              <span>Restaurant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffb300' }}></div>
              <span>Driver GPS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676' }}></div>
              <span>Your Pin</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
