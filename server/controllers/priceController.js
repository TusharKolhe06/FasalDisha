import axios from "axios";
import MarketPrice from "../models/MarketPrice.js";

const fallbackPrediction = (history, days) => {
  if (!history.length) return null;
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const recent = sorted.slice(-7);
  const avg = recent.reduce((s, x) => s + x.pricePerQuintal, 0) / recent.length;
  let trend = 0;
  if (recent.length >= 2) {
    trend = (recent[recent.length - 1].pricePerQuintal - recent[0].pricePerQuintal) /
      (recent.length - 1);
  }
  return Math.max(0, Math.round(avg + trend * days));
};

export const predictPrice = async (req, res) => {
  try {
    const { cropId, days = 7 } = req.body;
    const history = await MarketPrice.find({ crop: cropId })
      .sort({ date: 1 })
      .limit(180)
      .lean();

    if (!history.length) {
      return res.status(404).json({ message: "No market history available for this crop" });
    }

    try {
      const response = await axios.post(
        `${process.env.ML_URL}/predict`,
        {
          prices: history.map(x => x.pricePerQuintal),
          dates: history.map(x => new Date(x.date).toISOString()),
          days: Number(days)
        },
        { timeout: 3000 }
      );
      return res.json({ source: "ml", ...response.data });
    } catch {
      const prediction = fallbackPrediction(history, Number(days));
      return res.json({
        source: "fallback-trend",
        predictedPrice: prediction,
        days: Number(days),
        message: "Python ML service unavailable; trend-based prediction used."
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recommendation = async (req, res) => {
  try {
    const { cropId, quantity, farmerLocation } = req.body;
    const rows = await MarketPrice.find({ crop: cropId })
      .sort({ date: -1 })
      .limit(100);

    if (!rows.length) return res.status(404).json({ message: "No market prices found" });

    const latest = new Map();
    for (const row of rows) {
      if (!latest.has(row.marketName)) latest.set(row.marketName, row);
    }

    // Demo transport model. Replace with real routing API in production.
    const distanceKm = (market) => {
      if (!farmerLocation) return 50;
      const a = String(farmerLocation).toLowerCase();
      const m = market.marketName.toLowerCase();
      if (a.includes("nashik") && m.includes("nashik")) return 15;
      if (a.includes("pune") && m.includes("pune")) return 15;
      return 100;
    };

    const qtyQuintal = Number(quantity || 1);
    const options = [...latest.values()].map(row => {
      const km = distanceKm(row);
      const transportPerQuintal = km * 2; // demo ₹2 per quintal/km
      const gross = row.pricePerQuintal * qtyQuintal;
      const transport = transportPerQuintal * qtyQuintal;
      return {
        market: row.marketName,
        district: row.district,
        pricePerQuintal: row.pricePerQuintal,
        distanceKm: km,
        transportCost: Math.round(transport),
        estimatedNetProfit: Math.round(gross - transport),
        date: row.date
      };
    }).sort((a, b) => b.estimatedNetProfit - a.estimatedNetProfit);

    res.json({
      recommendation: options[0],
      options,
      formula: "Net profit = selling price × quantity − estimated transportation cost"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};