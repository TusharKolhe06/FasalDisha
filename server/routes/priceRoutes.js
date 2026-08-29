import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { predictPrice, recommendation } from "../controllers/priceController.js";

const router = express.Router();
router.post("/predict", protect, predictPrice);
router.post("/recommendation", protect, recommendation);
export default router;