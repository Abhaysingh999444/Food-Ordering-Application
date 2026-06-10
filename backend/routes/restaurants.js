import express from 'express';
import fs from 'fs';
import { dbService } from '../config/dbService.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const { cuisine, search } = req.query;
    let restaurants = await dbService.restaurants.find();

    if (cuisine) {
      restaurants = restaurants.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
    }

    if (search) {
      const searchLower = search.toLowerCase();
      restaurants = restaurants.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        r.cuisine.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }

    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await dbService.restaurants.findById(req.id || req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new restaurant (Admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, cuisine, image, rating, address, location, menu } = req.body;
    if (!name || !cuisine || !location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Missing required fields: name, cuisine, location (lat/lng)' });
    }

    const newRest = await dbService.restaurants.create({
      name,
      description: description || '',
      cuisine,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60',
      rating: rating || 4.5,
      address: address || '',
      location,
      menu: menu || []
    });

    res.status(201).json(newRest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update restaurant menu (Admin only)
router.put('/:id/menu', auth, adminOnly, async (req, res) => {
  try {
    const restaurant = await dbService.restaurants.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const updated = await dbService.restaurants.findByIdAndUpdate(req.params.id, {
      menu: req.body.menu
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a food item to restaurant menu (Admin only)
router.post('/:id/menu', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, description, category, image } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required.' });
    }

    const restaurant = await dbService.restaurants.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });

    const newDish = {
      name,
      price: Number(price),
      description: description || '',
      category: category || 'Mains',
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60'
    };

    let updatedRestaurant;
    if (global.useLocalDB) {
      const db = JSON.parse(fs.readFileSync(global.localDbPath, 'utf8'));
      const index = db.restaurants.findIndex(r => r._id === req.params.id);
      if (index !== -1) {
        newDish._id = Math.random().toString(36).substring(2, 11);
        db.restaurants[index].menu.push(newDish);
        fs.writeFileSync(global.localDbPath, JSON.stringify(db, null, 2));
        updatedRestaurant = db.restaurants[index];
      } else {
        return res.status(404).json({ message: 'Restaurant not found in local DB.' });
      }
    } else {
      restaurant.menu.push(newDish);
      await restaurant.save();
      updatedRestaurant = restaurant;
    }

    res.status(201).json(updatedRestaurant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
