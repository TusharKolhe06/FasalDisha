import express from "express";
import { getCrops, createCrop } from "../controllers/cropController.js";
import { protect, role } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", getCrops);
router.post("/", protect, role("farmer"), createCrop);
export default router;