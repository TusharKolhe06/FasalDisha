import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Crop from "./models/Crop.js";
import MarketPrice from "./models/MarketPrice.js";
import Product from "./models/Product.js";

dotenv.config();
await connectDB();

await Promise.all([
  User.deleteMany({}),
  Crop.deleteMany({}),
  MarketPrice.deleteMany({}),
  Product.deleteMany({})
]);

const farmer = await User.create({
  name: "Demo Farmer",
  email: "farmer@example.com",
  password: await bcrypt.hash("farmer123", 10),
  role: "farmer",
  phone: "9999999999",
  location: { village: "Nashik", district: "Nashik", state: "Maharashtra", lat: 20.0, lng: 73.78 }
});

await User.create({
  name: "Demo Buyer",
  email: "buyer@example.com",
  password: await bcrypt.hash("buyer123", 10),
  role: "buyer",
  phone: "8888888888",
  location: { district: "Pune", state: "Maharashtra" }
});

const crops = await Crop.insertMany([
  { name: "Tomato", localName: "टोमॅटो", category: "Vegetable", season: "Kharif/Rabi", unit: "quintal" },
  { name: "Onion", localName: "कांदा", category: "Vegetable", season: "Rabi", unit: "quintal" },
  { name: "Grapes", localName: "द्राक्षे", category: "Fruit", season: "Rabi", unit: "quintal" }
]);

const now = new Date();
const markets = ["Nashik Market", "Pune Market", "Mumbai Market", "Lasalgaon Market"];
const prices = [];

for (const crop of crops) {
  const base = crop.name === "Tomato" ? 2800 : crop.name === "Onion" ? 3200 : 7000;
  for (let i = 20; i >= 0; i--) {
    for (let j = 0; j < markets.length; j++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const variation = Math.round(Math.sin(i / 3 + j) * 250 + (20 - i) * 8);
      prices.push({
        crop: crop._id,
        marketName: markets[j],
        district: markets[j].split(" ")[0],
        pricePerQuintal: Math.max(500, base + variation + j * 180),
        minPrice: Math.max(400, base + variation - 150),
        maxPrice: base + variation + j * 180 + 200,
        arrivalQuantity: 50 + j * 15,
        date: d
      });
    }
  }
}

await MarketPrice.insertMany(prices);

await Product.create({
  farmer: farmer._id,
  crop: crops[0]._id,
  quantity: 500,
  unit: "kg",
  pricePerUnit: 28,
  description: "Fresh farm tomatoes. Bulk orders welcome.",
  location: "Nashik"
});

console.log("Seed complete.");
console.log("Farmer: farmer@example.com / farmer123");
console.log("Buyer: buyer@example.com / buyer123");
process.exit(0);