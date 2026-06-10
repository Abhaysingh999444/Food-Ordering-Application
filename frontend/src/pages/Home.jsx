import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Compass } from 'lucide-react';

const CUISINE_EMOJIS = {
  'North Indian': '🍛',
  'Italian': '🍕',
  'Japanese': '🍣',
  'American': '🍔',
  'Chinese': '🍜',
  'Mexican': '🌮',
  'Continental': '🥩',
  'Dessert': '🍰',
  'Desserts': '🍰',
  'Drinks': '🥤',
  'Sides': '🍟',
  'Fast Food': '🍔',
  'All': '🍽️'
};

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Geolocation states
  const [userCoords, setUserCoords] = useState(null);
  const [geoAddress, setGeoAddress] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://food-ordering-application-h8fj.onrender.com/api/restaurants');
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Local filtering is instant, so we don't need to re-fetch from API
  };

  // Build cuisines list dynamically
  const uniqueCuisineNames = ['All', ...new Set(restaurants.map(r => r.cuisine).filter(Boolean))];
  const dynamicCuisines = uniqueCuisineNames.map(name => ({
    name,
    emoji: CUISINE_EMOJIS[name] || '🍲'
  }));

  // Filter restaurants locally for instant response
  const filteredRestaurants = restaurants.filter(r => {
    const matchesCuisine = selectedCuisine === 'All' || r.cuisine.toLowerCase() === selectedCuisine.toLowerCase();
    const matchesSearch = !search || 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    return matchesCuisine && matchesSearch;
  });

  // Extract and filter matching dishes directly
  const allDishes = restaurants.flatMap(r => 
    (r.menu || []).map(dish => ({
      ...dish,
      restaurantId: r._id,
      restaurantName: r.name
    }))
  );

  const filteredDishes = search 
    ? allDishes.filter(dish => 
        dish.name.toLowerCase().includes(search.toLowerCase()) ||
        (dish.description && dish.description.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  // Get current GPS coordinates from user's browser
  const handleGetLocation = () => {
    setGeoLoading(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        
        // Save user coords in session storage for checkout Map loading
        sessionStorage.setItem('user_lat', latitude);
        sessionStorage.setItem('user_lng', longitude);

        // Fetch user location address using free Nominatim OpenStreetMap API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            // Trim address
            const parts = data.display_name.split(',');
            const shortAddress = parts.slice(0, 3).join(', ');
            setGeoAddress(shortAddress);
            sessionStorage.setItem('user_address', shortAddress);
          } else {
            setGeoAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (err) {
          setGeoAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not retrieve geolocation. Please choose address coordinates manually at checkout.');
        setGeoLoading(false);
      }
    );
  };

  return (
    <div className="container page-transition">
      
      {/* Hero Banner Section */}
      <div className="hero-banner">
        {/* Abstract shapes in the background */}
        <div className="hero-glow-blob"></div>

        <h1 className="hero-title">
          Deliciousness Delivered <br />
          <span style={{
            background: 'var(--primary-grad)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            To Your Doorstep
          </span>
        </h1>
        <p className="hero-subtitle">
          Order from the best restaurants around and track your hot meals in real-time.
        </p>

        {/* Search and Geolocation bar */}
        <div className="search-geo-bar">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '0.75rem' }} />
            <input
              type="text"
              placeholder="Search restaurants, cuisines, or dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">
              Find Food
            </button>
          </form>

          {/* Geolocation Button / Status */}
          <div className="geo-controls">
            <button 
              type="button" 
              onClick={handleGetLocation} 
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                gap: '0.4rem',
                borderColor: userCoords ? 'var(--success)' : 'var(--border-color)'
              }}
            >
              <Compass size={16} className={geoLoading ? 'spinner' : ''} style={{ animationDuration: '3s' }} />
              {userCoords ? 'Location Locked' : 'Locate Me'}
            </button>

            {geoAddress && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                color: 'var(--success)',
                background: 'rgba(0, 230, 118, 0.08)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0, 230, 118, 0.15)'
              }}>
                <MapPin size={14} />
                <span>Nearby: {geoAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Results / Cuisines */}
      {search ? (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>
            Dishes Matching "{search}"
          </h3>
          
          {filteredDishes.length === 0 ? (
            <div 
              className="glass-card" 
              style={{ 
                padding: '2.5rem 1.5rem', 
                textAlign: 'center', 
                borderColor: 'rgba(255, 23, 68, 0.15)',
                boxShadow: '0 10px 20px rgba(255,23,68,0.05)'
              }}
            >
              <span className="badge" style={{ background: 'rgba(255, 23, 68, 0.15)', color: 'var(--error)', marginBottom: '0.75rem', fontWeight: 800 }}>
                Not Available
              </span>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Dish Not Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                We couldn't find any dish matching your query. Please check spelling or try another product name.
              </p>
            </div>
          ) : (
            <div className="grid-auto">
              {filteredDishes.map((dish, idx) => (
                <div 
                  key={idx} 
                  className="glass-card food-card" 
                  style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center', 
                    cursor: 'pointer' 
                  }}
                  onClick={() => navigate(`/restaurant/${dish.restaurantId}`)}
                >
                  {dish.image && (
                    <img 
                      src={dish.image} 
                      alt={dish.name}
                      style={{ width: '85px', height: '85px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} 
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', marginBottom: '0.25rem' }}>
                      {dish.category}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '0.15rem' }}>{dish.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>from {dish.restaurantName}</p>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                      ₹{dish.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Cuisine Horizontal Filters (visible when search is empty) */
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Popular Cuisines</h3>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none'
          }}>
            {dynamicCuisines.map((cuisine, idx) => (
              <button
                key={cuisine.name}
                onClick={() => setSelectedCuisine(cuisine.name)}
                className={`btn stagger-item ${selectedCuisine === cuisine.name ? 'moving-gradient-green' : ''}`}
                style={{
                  background: selectedCuisine === cuisine.name ? undefined : 'var(--bg-surface)',
                  color: selectedCuisine === cuisine.name ? 'var(--text-inverse)' : 'var(--text-main)',
                  border: selectedCuisine === cuisine.name ? 'none' : '1px solid var(--border-color)',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  animationDelay: `${idx * 0.05}s`
                }}
              >
                <span>{cuisine.emoji}</span>
                <span>{cuisine.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Restaurant List Header */}
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem' }}>
          {search ? `Restaurants matching "${search}"` : selectedCuisine === 'All' ? 'All Restaurants' : `${selectedCuisine} Spots`}
        </h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {filteredRestaurants.length} kitchens near you
        </span>
      </div>

      {/* Restaurants Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No restaurants found matching your criteria.</p>
          <button onClick={() => { setSelectedCuisine('All'); setSearch(''); }} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-auto">
          {filteredRestaurants.map((rest) => (
            <div key={rest._id} className="glass-card food-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/restaurant/${rest._id}`)}>
              {/* Restaurant Image */}
              <div className="food-card-img-container">
                <img src={rest.image} alt={rest.name} className="food-card-img" />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(20, 20, 30, 0.85)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  <Star size={14} fill="var(--accent)" color="var(--accent)" />
                  <span>{rest.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem' }}>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                  {rest.cuisine}
                </span>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{rest.name}</h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '36px'
                }}>
                  {rest.description}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <MapPin size={12} color="var(--primary)" />
                  <span style={{
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}>{rest.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
