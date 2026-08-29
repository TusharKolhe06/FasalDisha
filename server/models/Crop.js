import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    localName: String,
    category: String,
    season: String,
    unit: { type: String, default: "quintal" }
  },
  { timestamps: true }
);

export default mongoose.model("Crop", cropSchema);