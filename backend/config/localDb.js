import fs from 'fs';

const getDb = () => {
  try {
    const data = fs.readFileSync(global.localDbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], restaurants: [], orders: [] };
  }
};

const saveDb = (db) => {
  fs.writeFileSync(global.localDbPath, JSON.stringify(db, null, 2));
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export const localDb = {
  users: {
    find: async (query = {}) => {
      const db = getDb();
      return db.users.filter(u => Object.keys(query).every(key => u[key] === query[key]));
    },
    findOne: async (query = {}) => {
      const db = getDb();
      return db.users.find(u => Object.keys(query).every(key => u[key] === query[key])) || null;
    },
    findById: async (id) => {
      const db = getDb();
      return db.users.find(u => u._id === id) || null;
    },
    create: async (data) => {
      const db = getDb();
      const newUser = { _id: generateId(), createdAt: new Date().toISOString(), ...data };
      db.users.push(newUser);
      saveDb(db);
      return newUser;
    }
  },
  restaurants: {
    find: async (query = {}) => {
      const db = getDb();
      return db.restaurants.filter(r => {
        return Object.keys(query).every(key => {
          if (key === 'cuisine' && query.cuisine) {
            return r.cuisine.toLowerCase() === query.cuisine.toLowerCase();
          }
          return r[key] === query[key];
        });
      });
    },
    findOne: async (query = {}) => {
      const db = getDb();
      return db.restaurants.find(r => Object.keys(query).every(key => r[key] === query[key])) || null;
    },
    findById: async (id) => {
      const db = getDb();
      return db.restaurants.find(r => r._id === id) || null;
    },
    create: async (data) => {
      const db = getDb();
      const newRest = { _id: generateId(), createdAt: new Date().toISOString(), ...data };
      db.restaurants.push(newRest);
      saveDb(db);
      return newRest;
    },
    findByIdAndUpdate: async (id, updates) => {
      const db = getDb();
      const index = db.restaurants.findIndex(r => r._id === id);
      if (index !== -1) {
        db.restaurants[index] = { ...db.restaurants[index], ...updates };
        saveDb(db);
        return db.restaurants[index];
      }
      return null;
    }
  },
  orders: {
    find: async (query = {}) => {
      const db = getDb();
      return db.orders.filter(o => {
        return Object.keys(query).every(key => {
          if (key === 'user') return o.user === query.user;
          return o[key] === query[key];
        });
      }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    findById: async (id) => {
      const db = getDb();
      return db.orders.find(o => o._id === id) || null;
    },
    create: async (data) => {
      const db = getDb();
      const newOrder = { 
        _id: generateId(), 
        createdAt: new Date().toISOString(), 
        status: 'Placed',
        driverLocation: null,
        ...data 
      };
      db.orders.push(newOrder);
      saveDb(db);
      return newOrder;
    },
    findByIdAndUpdate: async (id, updates) => {
      const db = getDb();
      const index = db.orders.findIndex(o => o._id === id);
      if (index !== -1) {
        db.orders[index] = { ...db.orders[index], ...updates, updatedAt: new Date().toISOString() };
        saveDb(db);
        return db.orders[index];
      }
      return null;
    }
  }
};
