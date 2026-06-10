import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String },
  image: { type: String }
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  cuisine: { type: String },
  image: { type: String },
  rating: { type: Number, default: 4.5 },
  address: { type: String },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  menu: [menuItemSchema],
  createdAt: { type: Date, default: Date.now }
});

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
