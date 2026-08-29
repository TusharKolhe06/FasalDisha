import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "kg" },
    pricePerUnit: { type: Number, required: true, min: 0 },
    description: String,
    imageUrl: String,
    location: String,
    status: { type: String, enum: ["active", "sold", "inactive"], default: "active" }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);