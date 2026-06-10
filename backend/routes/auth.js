import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { dbService } from '../config/dbService.js';
import { auth } from '../middleware/auth.js';


const router = express.Router();

// Register a new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address (e.g. name@domain.com).' });
    }

    const existingUser = await dbService.users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await dbService.users.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer'
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'super_secret_key_bitedash_123!@#',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authenticate user & login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address (e.g. name@domain.com).' });
    }

    const user = await dbService.users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_key_bitedash_123!@#',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile details
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await dbService.users.findById(req.user.id);
    if (!user) return res.status(400).json({ message: 'User not found.' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo Testing: Change role on the fly
router.put('/role', auth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Update user role
    const user = await dbService.users.findById(req.user.id);
    if (!user) return res.status(400).json({ message: 'User not found.' });

    // Update role
    let updatedUser;
    if (global.useLocalDB) {
      // Direct update for localDb
      const db = JSON.parse(fs.readFileSync(global.localDbPath, 'utf8'));
      const index = db.users.findIndex(u => u._id === req.user.id);
      if (index !== -1) {
        db.users[index].role = role;
        fs.writeFileSync(global.localDbPath, JSON.stringify(db, null, 2));
      }
      updatedUser = db.users.find(u => u._id === req.user.id);
    } else {
      user.role = role;
      await user.save();
      updatedUser = user;
    }

    const token = jwt.sign(
      { id: req.user.id, role },
      process.env.JWT_SECRET || 'super_secret_key_bitedash_123!@#',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: req.user.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
