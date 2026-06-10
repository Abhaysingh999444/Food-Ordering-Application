import express from 'express';
import { dbService } from '../config/dbService.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { startDriverSimulation } from '../config/driverSimulator.js';

const router = express.Router();

// Get all orders (Admin only)
router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    const orders = await dbService.orders.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders for the logged-in customer
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await dbService.orders.find({ user: req.user.id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await dbService.orders.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Check if authorized (either the ordering customer or an admin)
    const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
    if (orderUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to view this order.' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place a new order
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId, items, total, deliveryAddress, deliveryLocation } = req.body;
    if (!restaurantId || !items || !total || !deliveryAddress || !deliveryLocation) {
      return res.status(400).json({ message: 'Please provide all details: restaurantId, items, total, address, coordinates.' });
    }

    const newOrder = await dbService.orders.create({
      user: req.user.id,
      restaurant: restaurantId,
      items,
      total,
      deliveryAddress,
      deliveryLocation
    });

    // Notify admins via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order_alert', newOrder);
    }

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    const updatedOrder = await dbService.orders.findByIdAndUpdate(req.params.id, { status });
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found.' });

    // Emit event to customer viewing their order
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${req.params.id}`).emit('order_status_update', {
        orderId: req.params.id,
        status,
        order: updatedOrder
      });

      // If status is changed to OutForDelivery, start GPS route simulation!
      if (status === 'OutForDelivery') {
        const restaurant = await dbService.restaurants.findById(
          updatedOrder.restaurant._id || updatedOrder.restaurant
        );
        if (restaurant && restaurant.location) {
          startDriverSimulation(io, req.params.id, restaurant.location, updatedOrder.deliveryLocation);
        }
      }
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
