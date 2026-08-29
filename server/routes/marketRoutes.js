import express from "express";
import { getMarketPrices, getLatestByCrop, createMarketPrice } from "../controllers/marketController.js";
import { protect, role } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", getMarketPrices);
router.get("/crop/:cropId", getLatestByCrop);
router.post("/", protect, role("farmer"), createMarketPrice);
export default router;