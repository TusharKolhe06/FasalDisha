import MarketPrice from "../models/MarketPrice.js";
import { getMandiPrice } from "../services/mandiPriceService.js";

export const getMarketPrices = async (req, res) => {
  try {
    const { crop, district, date } = req.query;

    const filter = {};

    if (crop) {
      filter.crop = crop;
    }

    if (district) {
      filter.district = new RegExp(district, "i");
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      filter.date = {
        $gte: start,
        $lt: end
      };
    }

    const prices = await MarketPrice.find(filter)
      .populate("crop", "name localName unit")
      .sort({
        date: -1,
        pricePerQuintal: -1
      })
      .limit(200);

    res.json(prices);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const getLatestByCrop = async (req, res) => {
  try {
    const mongoose = (await import("mongoose")).default;

    const cropId = new mongoose.Types.ObjectId(
      req.params.cropId
    );

    const rows = await MarketPrice.aggregate([
      {
        $match: {
          crop: cropId
        }
      },
      {
        $sort: {
          date: -1
        }
      },
      {
        $limit: 1000
      }
    ]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


export const createMarketPrice = async (req, res) => {
  try {
    const price = await MarketPrice.create(req.body);

    const populatedPrice = await price.populate(
      "crop",
      "name localName unit"
    );

    res.status(201).json(populatedPrice);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};


// ==========================================
// GOVERNMENT MANDI PRICE API
// ==========================================

export const getMandiPrices = async (req, res) => {
  try {
    const { crop, district } = req.query;

    if (!crop) {
      return res.status(400).json({
        message: "Crop is required"
      });
    }

    const data = await getMandiPrice(
      crop,
      district
    );

    res.json(data);

  } catch (error) {
    console.error(
      "Mandi controller error:",
      error.message
    );

    res.status(500).json({
      message: error.message
    });
  }
};

// ==========================================
// BUYER OFFER VS MANDI BENCHMARK
// ==========================================

export const compareBuyerOffer = async (req, res) => {
  try {
    const { offerPrice, mandiPrice } = req.body;

    if (offerPrice === undefined || mandiPrice === undefined) {
      return res.status(400).json({
        message: "offerPrice and mandiPrice are required"
      });
    }

    const offer = Number(offerPrice);
    const benchmark = Number(mandiPrice);

    if (
      !Number.isFinite(offer) ||
      !Number.isFinite(benchmark) ||
      offer < 0 ||
      benchmark <= 0
    ) {
      return res.status(400).json({
        message: "Invalid offer or mandi price"
      });
    }

    const difference = offer - benchmark;

    const differencePercent =
      (difference / benchmark) * 100;

    let status;

    if (differencePercent >= 5) {
      status = "BETTER";
    } else if (differencePercent >= -5) {
      status = "FAIR";
    } else {
      status = "BELOW_MANDI";
    }

    res.json({
      offerPrice: offer,
      mandiBenchmark: benchmark,
      difference: Math.round(difference * 100) / 100,
      differencePercent:
        Math.round(differencePercent * 100) / 100,
      status
    });

  } catch (error) {
    console.error(
      "Offer comparison error:",
      error.message
    );

    res.status(500).json({
      message: "Unable to compare buyer offer"
    });
  }
};