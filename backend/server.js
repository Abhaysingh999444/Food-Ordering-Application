import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { seedDatabase } from './config/seedData.js';

import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS allowed
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT']
  }
});

// Expose Socket.io instance to the Express app
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);

// Root test route
app.get('/', (req, res) => {
  res.json({ message: 'BiteDash Food Delivery API is running.' });
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Customer joins a room to receive tracking updates for a specific order
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined tracking room for order_${orderId}`);
  });

  // Admin joins a dashboard room to monitor all store activities
  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`Socket ${socket.id} joined admin dashboard room`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to Database and start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect DB (falls back to local JSON file if MongoDB is offline)
  await connectDB();

  // Seed default restaurants
  await seedDatabase();

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`BiteDash Server is running on http://localhost:${PORT}`);
    console.log(`Active Database Mode: ${global.useLocalDB ? 'Local JSON File fallback' : 'MongoDB'}`);
    console.log(`====================================================`);
  });
};

startServer();
