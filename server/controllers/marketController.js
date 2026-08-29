import MarketPrice from "../models/MarketPrice.js";

export const getMarketPrices = async (req, res) => {
  try {
    const { crop, district, date } = req.query;
    const filter = {};
    if (crop) filter.crop = crop;
    if (district) filter.district = new RegExp(district, "i");
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    const prices = await MarketPrice.find(filter)
      .populate("crop", "name localName unit")
      .sort({ date: -1, pricePerQuintal: -1 })
      .limit(200);

    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLatestByCrop = async (req, res) => {
  try {
    const rows = await MarketPrice.aggregate([
      { $match: { crop: new (await import("mongoose")).default.Types.ObjectId(req.params.cropId) } },
      { $sort: { date: -1 } },
      { $limit: 1000 }
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMarketPrice = async (req, res) => {
  try {
    const price = await MarketPrice.create(req.body);
    res.status(201).json(await price.populate("crop", "name localName unit"));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};