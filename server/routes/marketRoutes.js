import express from "express";

import {
  getMarketPrices,
  getLatestByCrop,
  createMarketPrice,
  getMandiPrices,
  compareBuyerOffer
} from "../controllers/marketController.js";

import {
  protect,
  role
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// MARKET PRICE ROUTES
// ==========================================

router.get("/", getMarketPrices);

router.get(
  "/crop/:cropId",
  getLatestByCrop
);

// ==========================================
// GOVERNMENT MANDI PRICE API
// ==========================================

router.get(
  "/mandi",
  getMandiPrices
);

// ==========================================
// BUYER OFFER VS MANDI BENCHMARK
// ==========================================

router.post(
  "/compare-offer",
  compareBuyerOffer
);

// ==========================================
// CREATE MARKET PRICE
// ==========================================

router.post(
  "/",
  protect,
  role("farmer"),
  createMarketPrice
);

export default router;