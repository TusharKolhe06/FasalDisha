import mongoose from "mongoose";

const marketPriceSchema = new mongoose.Schema(
  {
    crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },
    marketName: { type: String, required: true, trim: true },
    district: String,
    state: { type: String, default: "Maharashtra" },
    pricePerQuintal: { type: Number, required: true, min: 0 },
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    arrivalQuantity: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

marketPriceSchema.index({ crop: 1, date: -1 });

export default mongoose.model("MarketPrice", marketPriceSchema);