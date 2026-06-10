import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { Order } from '../models/Order.js';
import { localDb } from './localDb.js';

export const dbService = {
  users: {
    findOne: async (query) => {
      if (global.useLocalDB) return localDb.users.findOne(query);
      return User.findOne(query);
    },
    findById: async (id) => {
      if (global.useLocalDB) return localDb.users.findById(id);
      return User.findById(id);
    },
    create: async (data) => {
      if (global.useLocalDB) return localDb.users.create(data);
      const user = new User(data);
      return user.save();
    }
  },
  restaurants: {
    find: async (query) => {
      if (global.useLocalDB) return localDb.restaurants.find(query);
      return Restaurant.find(query);
    },
    findById: async (id) => {
      if (global.useLocalDB) return localDb.restaurants.findById(id);
      return Restaurant.findById(id);
    },
    create: async (data) => {
      if (global.useLocalDB) return localDb.restaurants.create(data);
      const rest = new Restaurant(data);
      return rest.save();
    },
    findByIdAndUpdate: async (id, updates) => {
      if (global.useLocalDB) return localDb.restaurants.findByIdAndUpdate(id, updates);
      return Restaurant.findByIdAndUpdate(id, updates, { new: true });
    }
  },
  orders: {
    find: async (query) => {
      if (global.useLocalDB) return localDb.orders.find(query);
      return Order.find(query).populate('restaurant').sort({ createdAt: -1 });
    },
    findById: async (id) => {
      if (global.useLocalDB) {
        const order = await localDb.orders.findById(id);
        if (order) {
          // populate restaurant for localDb
          const rest = await localDb.restaurants.findById(order.restaurant);
          order.restaurant = rest;
        }
        return order;
      }
      return Order.findById(id).populate('restaurant');
    },
    create: async (data) => {
      if (global.useLocalDB) return localDb.orders.create(data);
      const order = new Order(data);
      await order.save();
      return Order.findById(order._id).populate('restaurant');
    },
    findByIdAndUpdate: async (id, updates) => {
      if (global.useLocalDB) {
        const order = await localDb.orders.findByIdAndUpdate(id, updates);
        if (order) {
          const rest = await localDb.restaurants.findById(order.restaurant);
          order.restaurant = rest;
        }
        return order;
      }
      return Order.findByIdAndUpdate(id, updates, { new: true }).populate('restaurant');
    }
  }
};
