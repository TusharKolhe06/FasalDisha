import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["farmer", "buyer"], default: "farmer" },
    phone: { type: String, trim: true },
    location: {
      village: String,
      district: String,
      state: { type: String, default: "Maharashtra" },
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);