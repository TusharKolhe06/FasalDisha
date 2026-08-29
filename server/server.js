import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import buyerRoutes from "./routes/buyerRoutes.js";
import priceRoutes from "./routes/priceRoutes.js";

dotenv.config();
await connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "FasalDisha API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/market-prices", marketRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/prices", priceRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));