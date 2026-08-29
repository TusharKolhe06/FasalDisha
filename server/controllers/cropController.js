import Crop from "../models/Crop.js";

export const getCrops = async (req, res) => {
  try {
    const crops = await Crop.find().sort({ name: 1 });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCrop = async (req, res) => {
  try {
    const crop = await Crop.create(req.body);
    res.status(201).json(crop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};