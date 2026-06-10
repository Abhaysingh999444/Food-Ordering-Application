import { dbService } from './dbService.js';

const mockRestaurants = [
  {
    name: "The Royal Spice",
    description: "Indulge in authentic rich Mughlai, Butter Chicken, and premium aromatic Biryanis.",
    cuisine: "North Indian",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=60",
    rating: 4.8,
    address: "Radial Road 3, Connaught Place, New Delhi",
    location: { lat: 28.6328, lng: 77.2195 },
    menu: [
      {
        name: "Murgh Makhani (Butter Chicken)",
        price: 380,
        description: "Tender chicken cooked in a rich, creamy, tomato butter gravy.",
        category: "Mains",
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&auto=format&fit=crop&q=60"
      },
      {
        name: "Awadhi Mutton Biryani",
        price: 450,
        description: "Slow-cooked basmati rice layered with spiced mutton and saffron.",
        category: "Biryani",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=60"
      },
      {
        name: "Garlic Naan",
        price: 80,
        description: "Soft leavened clay-oven flatbread brushed with fresh garlic butter.",
        category: "Breads",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=300&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    name: "Pizzeria Roma",
    description: "Artisanal wood-fired sourdough pizzas with authentic Italian ingredients.",
    cuisine: "Italian",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60",
    rating: 4.7,
    address: "Block H, Connaught Place, New Delhi",
    location: { lat: 28.6285, lng: 77.2155 },
    menu: [
      {
        name: "Margherita Basilico Pizza",
        price: 340,
        description: "San Marzano tomatoes, fresh mozzarella, extra virgin olive oil, and fresh basil.",
        category: "Pizza",
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&auto=format&fit=crop&q=60"
      },
      {
        name: "Truffle Mushroom Fettuccine",
        price: 420,
        description: "Creamy wild mushroom ragu, black truffle paste, and shaved parmesan.",
        category: "Pasta",
        image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=300&auto=format&fit=crop&q=60"
      },
      {
        name: "Classic Tiramisu",
        price: 260,
        description: "Espresso-soaked ladyfingers layered with rich whipped mascarpone cream.",
        category: "Dessert",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    name: "Sushi House",
    description: "Premium sashimi, signature maki rolls, and warm comforting bowls of Japanese ramen.",
    cuisine: "Japanese",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=60",
    rating: 4.9,
    address: "Block E, Outer Circle, Connaught Place, New Delhi",
    location: { lat: 28.6345, lng: 77.2140 },
    menu: [
      {
        name: "Salmon Avocado Maki",
        price: 480,
        description: "Fresh Norwegian salmon, creamy avocado, cucumber, rolled in toasted sesame.",
        category: "Maki",
        image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=300&auto=format&fit=crop&q=60"
      },
      {
        name: "Spicy Miso Ramen",
        price: 460,
        description: "Rich pork-chicken broth, spicy miso paste, chashu slices, soft-boiled egg, and nori.",
        category: "Ramen",
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    name: "Burger Bistro",
    description: "Sizzling smash burgers with premium cheddar cheese on sweet toasted brioche buns.",
    cuisine: "American",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60",
    rating: 4.6,
    address: "Block A, Connaught Place, New Delhi",
    location: { lat: 28.6270, lng: 77.2210 },
    menu: [
      {
        name: "Classic Double Smash Burger",
        price: 280,
        description: "Two crispy beef patties, double American cheese, special bistro sauce, and pickles.",
        category: "Burgers",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=60"
      },
      {
        name: "Truffle Parmesan Fries",
        price: 180,
        description: "Golden crispy fries tossed in white truffle oil, rosemary, and parmesan dust.",
        category: "Sides",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=60"
      }
    ]
  }
];

export const seedDatabase = async () => {
  try {
    const existing = await dbService.restaurants.find();
    if (existing.length === 0) {
      console.log('Seeding initial restaurant data...');
      for (const rest of mockRestaurants) {
        await dbService.restaurants.create(rest);
      }
      console.log('Successfully seeded database!');
    } else {
      console.log('Database already has restaurant data. Skipping seed.');
    }
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};
