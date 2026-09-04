import axios from "axios";
import MarketPrice from "../models/MarketPrice.js";
import { getMandiPrice } from "../services/mandiPriceService.js";

// ======================================================
// FALLBACK AI PRICE PREDICTION
// ======================================================

const fallbackPrediction = (history, days) => {
  if (!history.length) return null;

  const sorted = [...history].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const recent = sorted.slice(-7);

  const avg =
    recent.reduce(
      (sum, item) => sum + Number(item.pricePerQuintal),
      0
    ) / recent.length;

  let trend = 0;

  if (recent.length >= 2) {
    trend =
      (Number(recent[recent.length - 1].pricePerQuintal) -
        Number(recent[0].pricePerQuintal)) /
      (recent.length - 1);
  }

  return Math.max(
    0,
    Math.round(avg + trend * days)
  );
};

// ======================================================
// AI PRICE PREDICTION
// ======================================================

export const predictPrice = async (req, res) => {
  try {
    const { cropId, days = 7 } = req.body;

    if (!cropId) {
      return res.status(400).json({
        message: "Crop ID is required"
      });
    }

    const predictionDays = Number(days);

    if (
      !Number.isFinite(predictionDays) ||
      predictionDays <= 0
    ) {
      return res.status(400).json({
        message: "Days must be greater than 0"
      });
    }

    const history = await MarketPrice.find({
      crop: cropId
    })
      .sort({ date: 1 })
      .limit(180)
      .lean();

    if (!history.length) {
      return res.status(404).json({
        message: "No market history available for this crop"
      });
    }

    // ==================================================
    // TRY PYTHON ML SERVICE
    // ==================================================

    try {
      const response = await axios.post(
        `${process.env.ML_URL}/predict`,
        {
          prices: history.map((item) =>
            Number(item.pricePerQuintal)
          ),

          dates: history.map((item) =>
            new Date(item.date).toISOString()
          ),

          days: predictionDays
        },
        {
          timeout: 3000
        }
      );

      return res.json({
        source: "ml",
        ...response.data
      });
    } catch (mlError) {
      console.log(
        "Python ML service unavailable. Using fallback prediction."
      );

      const prediction = fallbackPrediction(
        history,
        predictionDays
      );

      return res.json({
        source: "fallback-trend",
        predictedPrice: prediction,
        days: predictionDays,
        message:
          "Python ML service unavailable; trend-based prediction used."
      });
    }
  } catch (error) {
    console.error(
      "Price prediction error:",
      error.message
    );

    res.status(500).json({
      message: error.message
    });
  }
};

// ======================================================
// SMART SELLING RECOMMENDATION
// ======================================================
//
// Combines:
//
// Current Market Price
// + Government Mandi Benchmark
// + AI Predicted Price
// + Distance
// + Transport Cost
// + Quantity
// = Estimated Net Profit
//
// IMPORTANT:
// Mandi price is a benchmark, NOT a guaranteed selling price.
// AI prediction is a planning signal, NOT a guaranteed price.
//
// ======================================================

export const recommendation = async (req, res) => {
  try {
    const {
      cropId,
      cropName,
      quantity,
      farmerLocation,
      district
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!cropId) {
      return res.status(400).json({
        message: "Crop ID is required"
      });
    }

    const qtyQuintal = Number(quantity || 1);

    if (
      !Number.isFinite(qtyQuintal) ||
      qtyQuintal <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

    // ==================================================
    // GET MARKET HISTORY
    // ==================================================

    const rows = await MarketPrice.find({
      crop: cropId
    })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    if (!rows.length) {
      return res.status(404).json({
        message: "No market prices found"
      });
    }

    // ==================================================
    // LATEST PRICE FOR EACH MARKET
    // ==================================================

    const latest = new Map();

    for (const row of rows) {
      if (!row.marketName) continue;

      if (!latest.has(row.marketName)) {
        latest.set(row.marketName, row);
      }
    }

    // ==================================================
    // GET AI PREDICTED PRICE
    // ==================================================

    let aiPredictedPrice = null;
    let predictionSource = "unavailable";

    try {
      const historyForAI = await MarketPrice.find({
        crop: cropId
      })
        .sort({ date: 1 })
        .limit(180)
        .lean();

      if (historyForAI.length) {
        try {
          const mlResponse = await axios.post(
            `${process.env.ML_URL}/predict`,
            {
              prices: historyForAI.map((item) =>
                Number(item.pricePerQuintal)
              ),

              dates: historyForAI.map((item) =>
                new Date(item.date).toISOString()
              ),

              days: 7
            },
            {
              timeout: 3000
            }
          );

          const predicted =
            Number(
              mlResponse.data?.predictedPrice
            );

          if (
            Number.isFinite(predicted) &&
            predicted > 0
          ) {
            aiPredictedPrice = predicted;
            predictionSource = "ml";
          }
        } catch {
          const fallback =
            fallbackPrediction(
              historyForAI,
              7
            );

          if (
            Number.isFinite(fallback) &&
            fallback > 0
          ) {
            aiPredictedPrice = fallback;
            predictionSource = "fallback-trend";
          }
        }
      }
    } catch (predictionError) {
      console.log(
        "AI recommendation prediction unavailable:",
        predictionError.message
      );
    }

    // ==================================================
    // GOVERNMENT MANDI BENCHMARK
    // ==================================================

    let mandiBenchmark = 0;
    let mandiMarkets = [];
    let mandiSource = "unavailable";
    let mandiError = null;

    const selectedCropName =
      cropName ||
      rows[0]?.cropName ||
      rows[0]?.crop ||
      "";

    const selectedDistrict =
      district ||
      farmerLocation ||
      "";

    if (selectedCropName) {
      try {
        const mandiData = await getMandiPrice(
          selectedCropName,
          selectedDistrict
        );

        mandiBenchmark =
          Number(
            mandiData?.benchmarkPricePerQuintal || 0
          );

        mandiMarkets =
          mandiData?.markets || [];

        mandiSource =
          mandiData?.source ||
          "Government of India OGD / AGMARKNET";
      } catch (mandiErr) {
        console.log(
          "Mandi benchmark unavailable:",
          mandiErr.message
        );

        mandiError =
          mandiErr.message;
      }
    }

    // ==================================================
    // DISTANCE MODEL
    // ==================================================
    //
    // Prototype estimate.
    // Replace with real routing API later.
    //
    // ==================================================

    const distanceKm = (market) => {
      const farmer =
        String(
          farmerLocation ||
          district ||
          ""
        ).toLowerCase();

      const marketName =
        String(
          market.marketName || ""
        ).toLowerCase();

      if (
        farmer.includes("nashik") &&
        marketName.includes("nashik")
      ) {
        return 15;
      }

      if (
        farmer.includes("pune") &&
        marketName.includes("pune")
      ) {
        return 15;
      }

      if (
        farmer.includes("mumbai") &&
        marketName.includes("mumbai")
      ) {
        return 15;
      }

      if (
        farmer.includes("nagpur") &&
        marketName.includes("nagpur")
      ) {
        return 15;
      }

      if (
        farmer.includes("ahmednagar") &&
        marketName.includes("ahmednagar")
      ) {
        return 15;
      }

      return 100;
    };

    // ==================================================
    // TRANSPORT COST
    // ==================================================

    // Prototype estimate:
    // ₹2 per quintal per kilometer

    const transportRate = 2;

    // ==================================================
    // CALCULATE MARKET OPTIONS
    // ==================================================

    const options = [...latest.values()]
      .map((row) => {
        const km = distanceKm(row);

        const currentPrice =
          Number(row.pricePerQuintal);

        if (
          !Number.isFinite(currentPrice) ||
          currentPrice <= 0
        ) {
          return null;
        }

        // ==================================================
        // MANDI BENCHMARK COMPARISON
        // ==================================================

        let marketMandiBenchmark =
          mandiBenchmark;

        if (mandiMarkets.length) {
          const matchingMandi =
            mandiMarkets.find((mandi) =>
              String(mandi.market)
                .toLowerCase()
                .includes(
                  String(row.marketName)
                    .toLowerCase()
                ) ||
              String(row.marketName)
                .toLowerCase()
                .includes(
                  String(mandi.market)
                    .toLowerCase()
                )
            );

          if (
            matchingMandi?.modalPrice &&
            Number(matchingMandi.modalPrice) > 0
          ) {
            marketMandiBenchmark =
              Number(
                matchingMandi.modalPrice
              );
          }
        }

        // ==================================================
        // PLANNING SELLING PRICE
        // ==================================================
        //
        // Current price = actual market reference.
        //
        // AI prediction = future planning signal.
        //
        // We do NOT use the mandi benchmark as guaranteed
        // revenue.
        //
        // If AI prediction is available:
        //
        // Planning Price =
        // (Current Price + AI Prediction) / 2
        //
        // Otherwise:
        //
        // Planning Price = Current Price
        //
        // This avoids treating AI prediction as guaranteed.
        //
        // ==================================================

        let expectedSellingPrice =
          currentPrice;

        let planningMethod =
          "current-market-price";

        if (
          Number.isFinite(aiPredictedPrice) &&
          aiPredictedPrice > 0
        ) {
          expectedSellingPrice =
            (currentPrice +
              aiPredictedPrice) /
            2;

          planningMethod =
            "current-price-and-ai-average";
        }

        expectedSellingPrice =
          Math.max(
            0,
            expectedSellingPrice
          );

        // ==================================================
        // REVENUE
        // ==================================================

        const grossRevenue =
          expectedSellingPrice *
          qtyQuintal;

        // ==================================================
        // TRANSPORT
        // ==================================================

        const transportCost =
          km *
          transportRate *
          qtyQuintal;

        // ==================================================
        // ESTIMATED NET PROFIT
        // ==================================================

        const estimatedNetProfit =
          grossRevenue -
          transportCost;

        const netPricePerQuintal =
          estimatedNetProfit /
          qtyQuintal;

        // ==================================================
        // MANDI DIFFERENCE
        // ==================================================

        let mandiDifference = null;
        let mandiDifferencePercent = null;
        let mandiStatus = "UNAVAILABLE";

        if (
          marketMandiBenchmark > 0
        ) {
          mandiDifference =
            currentPrice -
            marketMandiBenchmark;

          mandiDifferencePercent =
            (
              mandiDifference /
              marketMandiBenchmark
            ) *
            100;

          if (
            mandiDifferencePercent >= 5
          ) {
            mandiStatus = "BETTER";
          } else if (
            mandiDifferencePercent >= -5
          ) {
            mandiStatus = "FAIR";
          } else {
            mandiStatus = "BELOW_MANDI";
          }
        }

        // ==================================================
        // AI PREDICTION DIFFERENCE
        // ==================================================

        let aiDifference = null;
        let aiDifferencePercent = null;

        if (
          Number.isFinite(aiPredictedPrice) &&
          aiPredictedPrice > 0
        ) {
          aiDifference =
            aiPredictedPrice -
            currentPrice;

          aiDifferencePercent =
            (
              aiDifference /
              currentPrice
            ) *
            100;
        }

        return {
          market: row.marketName,

          district: row.district,

          // Current actual market price
          currentPricePerQuintal:
            Math.round(
              currentPrice * 100
            ) / 100,

          // Government benchmark
          mandiBenchmarkPerQuintal:
            marketMandiBenchmark > 0
              ? Math.round(
                  marketMandiBenchmark *
                    100
                ) / 100
              : null,

          // AI predicted price
          aiPredictedPricePerQuintal:
            Number.isFinite(
              aiPredictedPrice
            )
              ? Math.round(
                  aiPredictedPrice *
                    100
                ) / 100
              : null,

          aiPredictionSource:
            predictionSource,

          // Planning estimate
          expectedSellingPricePerQuintal:
            Math.round(
              expectedSellingPrice *
                100
            ) / 100,

          planningMethod,

          quantityQuintal:
            qtyQuintal,

          distanceKm:
            km,

          transportRatePerQuintalKm:
            transportRate,

          transportCost:
            Math.round(
              transportCost * 100
            ) / 100,

          grossRevenue:
            Math.round(
              grossRevenue * 100
            ) / 100,

          netPricePerQuintal:
            Math.round(
              netPricePerQuintal * 100
            ) / 100,

          estimatedNetProfit:
            Math.round(
              estimatedNetProfit * 100
            ) / 100,

          // Mandi comparison
          mandiDifference:
            mandiDifference !== null
              ? Math.round(
                  mandiDifference * 100
                ) / 100
              : null,

          mandiDifferencePercent:
            mandiDifferencePercent !== null
              ? Math.round(
                  mandiDifferencePercent *
                    100
                ) / 100
              : null,

          mandiStatus,

          // AI comparison
          aiDifference:
            aiDifference !== null
              ? Math.round(
                  aiDifference * 100
                ) / 100
              : null,

          aiDifferencePercent:
            aiDifferencePercent !== null
              ? Math.round(
                  aiDifferencePercent *
                    100
                ) / 100
              : null,

          date: row.date
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.estimatedNetProfit -
          a.estimatedNetProfit
      );

    // ==================================================
    // NO VALID OPTIONS
    // ==================================================

    if (!options.length) {
      return res.status(404).json({
        message:
          "No valid market prices available for recommendation"
      });
    }

    // ==================================================
    // BEST MARKET
    // ==================================================

    const bestMarket =
      options[0];

    // ==================================================
    // SUMMARY
    // ==================================================

    const summary = {
      quantityQuintal:
        qtyQuintal,

      recommendedMarket:
        bestMarket.market,

      currentMarketPricePerQuintal:
        bestMarket.currentPricePerQuintal,

      mandiBenchmarkPerQuintal:
        bestMarket.mandiBenchmarkPerQuintal,

      aiPredictedPricePerQuintal:
        bestMarket.aiPredictedPricePerQuintal,

      expectedSellingPricePerQuintal:
        bestMarket.expectedSellingPricePerQuintal,

      distanceKm:
        bestMarket.distanceKm,

      estimatedTransportCost:
        bestMarket.transportCost,

      grossRevenue:
        bestMarket.grossRevenue,

      estimatedNetProfit:
        bestMarket.estimatedNetProfit,

      mandiStatus:
        bestMarket.mandiStatus,

      aiPredictionSource:
        predictionSource,

      planningMethod:
        bestMarket.planningMethod
    };

    // ==================================================
    // RESPONSE
    // ==================================================

    res.json({
      recommendation:
        bestMarket,

      options,

      summary,

      formula:
        "Estimated net profit = (planning selling price × quantity) − transportation cost",

      planningPriceFormula:
        "Planning selling price = (current market price + AI predicted price) ÷ 2",

      calculationInputs: {
        mandiBenchmark:
          mandiBenchmark || null,

        aiPredictedPrice:
          Number.isFinite(
            aiPredictedPrice
          )
            ? aiPredictedPrice
            : null,

        distanceKm:
          bestMarket.distanceKm,

        transportRatePerQuintalKm:
          transportRate,

        quantityQuintal:
          qtyQuintal
      },

      sources: {
        mandi:
          mandiSource,

        ai:
          predictionSource
      },

      warnings: {
        mandi:
          mandiError,

        ai:
          "AI predicted price is a planning estimate and is not a guaranteed future selling price.",

        planning:
          "Estimated selling price combines the current market price and AI prediction; actual selling price may differ.",

        transport:
          "Distance and transportation cost currently use a prototype estimate. Real routing/transport APIs can be integrated later."
      },

      note:
        "Use the mandi benchmark to judge whether a market offer is competitive, while the AI prediction provides a future price planning signal."
    });
  } catch (error) {
    console.error(
      "Recommendation error:",
      error.message
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to generate smart selling recommendation"
    });
  }
};