
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PriceChart from "../components/PriceChart";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

import {
  saveOfflineData,
  getOfflineData
} from "../services/offlineStorage";

import { useOffline } from "../context/useOffline";

export default function Markets() {
  const [crops, setCrops] = useState([]);
  const [cropId, setCropId] = useState("");
  const [prices, setPrices] = useState([]);

  const [quantity, setQuantity] = useState(5);
  const [recommendation, setRecommendation] = useState(null);
  const [prediction, setPrediction] = useState(null);

  // ==========================================
  // MANDI PRICE STATES
  // ==========================================

  const [mandiCrop, setMandiCrop] = useState("Tomato");
  const [mandiDistrict, setMandiDistrict] = useState("Nashik");
  const [mandiData, setMandiData] = useState(null);
  const [mandiLoading, setMandiLoading] = useState(false);
  const [mandiError, setMandiError] = useState("");

  const { user } = useAuth();
  const { t } = useTranslation();
  const { isOnline } = useOffline();

  // ==========================================
  // LOAD CROPS
  // ==========================================

  useEffect(() => {
    const loadCrops = async () => {
      try {
        if (isOnline) {
          const res = await api.get("/crops");

          setCrops(res.data);
          saveOfflineData("crops", res.data);

          if (res.data[0]) {
            setCropId(res.data[0]._id);
          }
        } else {
          const cachedCrops = getOfflineData("crops");

          if (cachedCrops?.length) {
            setCrops(cachedCrops);

            if (cachedCrops[0]) {
              setCropId(cachedCrops[0]._id);
            }
          }
        }
      } catch (error) {
        console.error("Could not load crops:", error);

        const cachedCrops = getOfflineData("crops");

        if (cachedCrops?.length) {
          setCrops(cachedCrops);

          if (cachedCrops[0]) {
            setCropId(cachedCrops[0]._id);
          }
        }
      }
    };

    loadCrops();
  }, [isOnline]);

  // ==========================================
  // LOAD MARKET PRICES
  // ==========================================

  useEffect(() => {
    if (!cropId) return;

    const loadPrices = async () => {
      try {
        if (isOnline) {
          const res = await api.get(
            `/market-prices?crop=${cropId}`
          );

          setPrices(res.data);

          saveOfflineData(
            `market_prices_${cropId}`,
            res.data
          );
        } else {
          const cachedPrices = getOfflineData(
            `market_prices_${cropId}`
          );

          setPrices(cachedPrices || []);
        }
      } catch (error) {
        console.error(
          "Could not load market prices:",
          error
        );

        const cachedPrices = getOfflineData(
          `market_prices_${cropId}`
        );

        setPrices(cachedPrices || []);
      }
    };

    loadPrices();

    setRecommendation(null);
    setPrediction(null);
  }, [cropId, isOnline]);

  // ==========================================
  // SELECTED CROP
  // ==========================================

  const selectedCrop = useMemo(() => {
    return crops.find(
      (crop) => crop._id === cropId
    );
  }, [crops, cropId]);

  // ==========================================
  // LATEST MARKET COMPARISON
  // ==========================================

  const latest = useMemo(() => {
    const map = new Map();

    prices.forEach((p) => {
      if (!map.has(p.marketName)) {
        map.set(p.marketName, p);
      }
    });

    return [...map.values()];
  }, [prices]);

  
// ==========================================
// GOVERNMENT MANDI PRICES
// ==========================================

const fetchMandiPrices = async () => {
  if (!isOnline) {
    setMandiError(
      t("internetRequiredMandi")
    );
    return;
  }

  try {
    setMandiLoading(true);
    setMandiError("");
    setMandiData(null);

    const response = await api.get(
      "/market-prices/mandi",
      {
        params: {
          crop: mandiCrop,
          district: mandiDistrict
        }
      }
    );

    console.log(
      "================================="
    );
    console.log(
      "MANDI DATA RECEIVED:",
      response.data
    );
    console.log(
      "================================="
    );

    setMandiData(response.data);

    saveOfflineData(
      `mandi_${mandiCrop}_${mandiDistrict}`,
      response.data
    );

  } catch (error) {
    console.error(
      "================================="
    );
    console.error(
      "Could not fetch mandi prices:",
      error
    );
    console.error(
      "STATUS:",
      error.response?.status
    );
    console.error(
      "SERVER ERROR:",
      error.response?.data
    );
    console.error(
      "================================="
    );

    const cachedData = getOfflineData(
      `mandi_${mandiCrop}_${mandiDistrict}`
    );

    if (cachedData) {
      setMandiData(cachedData);

      setMandiError(
        t("showingSavedMandiData")
      );
    } else {
      setMandiError(
        error.response?.data?.message ||
          t("couldNotFetchMandiPrices")
      );
    }

  } finally {
    setMandiLoading(false);
  }
};



  // ==========================================
  // SMART SELLING RECOMMENDATION
  // ==========================================

  const recommend = async () => {
    if (!user) {
      return alert(t("pleaseLoginFirst"));
    }

    if (!cropId) {
      return alert(t("pleaseSelectCrop"));
    }

    if (!quantity || Number(quantity) <= 0) {
      return alert(t("validQuantity"));
    }

    if (!isOnline) {
      return alert(t("internetRecommendation"));
    }

    try {
      const farmerDistrict =
        user.location?.district || "";

      const cropName =
        selectedCrop?.name || "";

      const { data } = await api.post(
        "/prices/recommendation",
        {
          cropId,
          cropName,
          quantity: Number(quantity),
          farmerLocation: farmerDistrict,
          district: farmerDistrict
        }
      );

      setRecommendation(data);
    } catch (error) {
      console.error(
        "Recommendation error:",
        error
      );

      alert(
        error.response?.data?.message ||
          t("couldNotGetRecommendation")
      );
    }
  };

  // ==========================================
  // AI PRICE PREDICTION
  // ==========================================

  const predict = async () => {
    if (!user) {
      return alert(t("pleaseLoginFirst"));
    }

    if (!cropId) {
      return alert(t("pleaseSelectCrop"));
    }

    if (!isOnline) {
      return alert(t("internetPrediction"));
    }

    try {
      const { data } = await api.post(
        "/prices/predict",
        {
          cropId,
          days: 7
        }
      );

      setPrediction(data);
    } catch (error) {
      console.error(
        "Prediction error:",
        error
      );

      alert(
        error.response?.data?.message ||
          t("couldNotPredictPrice")
      );
    }
  };

  // ==========================================
  // FORMAT MONEY
  // ==========================================

  const formatMoney = (value) => {
    if (
      value === undefined ||
      value === null ||
      Number.isNaN(Number(value))
    ) {
      return "—";
    }

    return Number(value).toLocaleString(
      "en-IN"
    );
  };

  // ==========================================
  // MANDI STATUS
  // ==========================================

  const getMandiStatusText = (status) => {
    switch (status) {
      case "BETTER":
        return `🟢 ${t("aboveMandiBenchmark")}`;

      case "FAIR":
        return `🟡 ${t("nearMandiBenchmark")}`;

      case "BELOW_MANDI":
        return `🔴 ${t("belowMandiBenchmark")}`;

      default:
        return `⚪ ${t("mandiBenchmarkUnavailable")}`;
    }
  };

  // ==========================================
  // AI TREND TEXT
  // ==========================================

  const getAITrendText = (difference) => {
    const percent = Math.abs(
      Number(difference)
    ).toFixed(2);

    if (difference >= 0) {
      return {
        title: `📈 ${t("expectedPriceIncrease")}`,
        description: t(
          "aiPredictedPriceHigher",
          { percent }
        )
      };
    }

    return {
      title: `📉 ${t("expectedPriceDecrease")}`,
      description: t(
        "aiPredictedPriceLower",
        { percent }
      )
    };
  };

  return (
    <main>

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="page-head">

        <div>

          <p className="eyebrow">
            {t("priceDiscovery")}
          </p>

          <h2>
            {t("marketPrices")}
          </h2>

          {!isOnline && (
            <p className="offline-data-note">
              📡 {t("showingSavedMarketData")}
            </p>
          )}

        </div>

        <select
          value={cropId}
          onChange={(e) =>
            setCropId(e.target.value)
          }
        >
          {crops.map((c) => (
            <option
              key={c._id}
              value={c._id}
            >
              {c.name} — {c.localName}
            </option>
          ))}
        </select>

      </div>


      {/* ==========================================
          EXISTING MARKET DATA + CHART
      ========================================== */}

      <div className="grid two">

        <section className="card">

          <h3>
            {t("latestMarketComparison")}
          </h3>

          {latest.length === 0 ? (

            <p>
              {isOnline
                ? t("noMarketData")
                : t("noSavedMarketData")}
            </p>

          ) : (

            <table>

              <thead>

                <tr>

                  <th>
                    {t("market")}
                  </th>

                  <th>
                    {t("pricePerQuintal")}
                  </th>

                  <th>
                    {t("district")}
                  </th>

                </tr>

              </thead>

              <tbody>

                {latest.map((p) => (

                  <tr key={p._id}>

                    <td>
                      {p.marketName}
                    </td>

                    <td>
                      ₹
                      {formatMoney(
                        p.pricePerQuintal
                      )}
                    </td>

                    <td>
                      {p.district}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </section>


        <section className="card">

          <h3>
            {t("priceHistory")}
          </h3>

          {prices.length > 0 ? (

            <PriceChart data={prices} />

          ) : (

            <p>
              {t("noPriceHistory")}
            </p>

          )}

        </section>

      </div>


      {/* ==========================================
          GOVERNMENT MANDI PRICE DISCOVERY
      ========================================== */}

      <section className="card mandi-card">

        <div className="mandi-header">

          <div>

            <p className="eyebrow">
              {t("governmentMandiData")}
            </p>

            <h2>
              {t("todaysMandiPrices")}
            </h2>

            <p>
              {t("compareMandiPrices")}
            </p>

          </div>

        </div>


        {/* MANDI CONTROLS */}

        <div className="mandi-controls">

          <label>

            {t("crop")}

            <select
              value={mandiCrop}
              onChange={(e) =>
                setMandiCrop(e.target.value)
              }
            >

              <option value="Tomato">
                Tomato
              </option>

              <option value="Onion">
                Onion
              </option>

              <option value="Grapes">
                Grapes
              </option>

            </select>

          </label>


          <label>

            {t("district")}

            <select
              value={mandiDistrict}
              onChange={(e) =>
                setMandiDistrict(e.target.value)
              }
            >

              <option value="Nashik">
                Nashik
              </option>

              <option value="Pune">
                Pune
              </option>

              <option value="Mumbai">
                Mumbai
              </option>

              <option value="Nagpur">
                Nagpur
              </option>

              <option value="Ahmednagar">
                Ahmednagar
              </option>

            </select>

          </label>


          <button
            className="btn"
            onClick={fetchMandiPrices}
            disabled={
              mandiLoading || !isOnline
            }
          >

            {mandiLoading
              ? t("loading")
              : t("checkMandiPrices")}

          </button>

        </div>


        {/* MANDI ERROR */}

        {mandiError && (

          <div className="mandi-message">
            ⚠️ {mandiError}
          </div>

        )}


        {/* MANDI BENCHMARK */}

        {mandiData?.benchmarkPricePerQuintal > 0 && (

          <div className="mandi-benchmark">

            <div>

              <span>
                {t("fasalDishaMandiBenchmark")}
              </span>

              <small>
                {mandiData.crop} •{" "}
                {mandiData.district ||
                  "Maharashtra"}
              </small>

            </div>

            <strong>

              ₹
              {formatMoney(
                mandiData
                  .benchmarkPricePerQuintal
              )}

              <small>
                /{t("quintal")}
              </small>

            </strong>

          </div>

        )}


        {/* MANDI MARKET TABLE */}

        {mandiData?.markets?.length > 0 && (

          <div className="mandi-table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    {t("market")}
                  </th>

                  <th>
                    {t("minimumPrice")}
                  </th>

                  <th>
                    {t("maximumPrice")}
                  </th>

                  <th>
                    {t("modalPrice")}
                  </th>

                </tr>

              </thead>

              <tbody>

                {mandiData.markets.map(
                  (market, index) => (

                    <tr key={index}>

                      <td>
                        {market.market}
                      </td>

                      <td>
                        ₹
                        {formatMoney(
                          market.minPrice
                        )}
                      </td>

                      <td>
                        ₹
                        {formatMoney(
                          market.maxPrice
                        )}
                      </td>

                      <td>

                        <strong>
                          ₹
                          {formatMoney(
                            market.modalPrice
                          )}
                        </strong>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}


        {mandiData &&
          mandiData.markets?.length === 0 && (

            <p className="empty-state">
              {t("noMandiData")}
            </p>

          )}

      </section>


      {/* ==========================================
          SMART SELLING ENGINE
      ========================================== */}

      <section className="card">

        <h3>
          🧠 {t("smartSellingRecommendationTitle")}
        </h3>

        <p>
          {t("smartSellingDescription")}
        </p>


        {/* CONTROLS */}

        <div className="inline-form">

          <label>

            {t("quantityQuintal")}

            <input
              type="number"
              min="1"
              step="0.1"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
            />

          </label>


          <button
            className="btn"
            onClick={recommend}
            disabled={!isOnline}
          >

            {t("findBestMarket")}

          </button>


          <button
            className="btn secondary"
            onClick={predict}
            disabled={!isOnline}
          >

            {t("predict7DayPrice")}

          </button>

        </div>


        {!isOnline && (

          <p className="offline-feature-note">
            📡{" "}
            {t(
              "offlineRecommendationPrediction"
            )}
          </p>

        )}


        {/* SMART RECOMMENDATION RESULT */}

        {recommendation?.recommendation && (

          <div className="recommend">

            <p className="eyebrow">
              🏆{" "}
              {t(
                "smartSellingRecommendationTitle"
              )}
            </p>

            <h3>

              {t("recommendedMarket")}:{" "}

              {recommendation
                .recommendation.market}

            </h3>


            {/* MAIN CALCULATION GRID */}

            <div className="recommend-grid">

              <div>

                <span>
                  {t("currentMarketPrice")}
                </span>

                <strong>

                  ₹
                  {formatMoney(
                    recommendation
                      .recommendation
                      .currentPricePerQuintal
                  )}

                  <small>
                    /{t("quintal")}
                  </small>

                </strong>

              </div>


              <div>

                <span>
                  🏛️{" "}
                  {t("mandiBenchmark")}
                </span>

                <strong>

                  ₹
                  {formatMoney(
                    recommendation
                      .recommendation
                      .mandiBenchmarkPerQuintal
                  )}

                  <small>
                    /{t("quintal")}
                  </small>

                </strong>

              </div>


              <div>

                <span>
                  🤖{" "}
                  {t("aiPredictedPrice")}
                </span>

                <strong>

                  ₹
                  {formatMoney(
                    recommendation
                      .recommendation
                      .aiPredictedPricePerQuintal
                  )}

                  <small>
                    /{t("quintal")}
                  </small>

                </strong>

              </div>


              <div>

                <span>
                  {t("expectedSellingPrice")}
                </span>

                <strong>

                  ₹
                  {formatMoney(
                    recommendation
                      .recommendation
                      .expectedSellingPricePerQuintal
                  )}

                  <small>
                    /{t("quintal")}
                  </small>

                </strong>

              </div>


              <div>

                <span>
                  {t("quantity")}
                </span>

                <strong>

                  {formatMoney(
                    recommendation
                      .recommendation
                      .quantityQuintal
                  )}

                  <small>
                    {t("quintal")}
                  </small>

                </strong>

              </div>


              <div>

                <span>
                  📍 {t("distance")}
                </span>

                <strong>

                  {formatMoney(
                    recommendation
                      .recommendation
                      .distanceKm
                  )}

                  <small>
                    km
                  </small>

                </strong>

              </div>


              <div>

                <span>
                  🚚 {t("transportCost")}
                </span>

                <strong>

                  ₹
                  {formatMoney(
                    recommendation
                      .recommendation
                      .transportCost
                  )}

                </strong>

              </div>


              <div>

                <span>
                  {t("grossRevenue")}
                </span>

                <strong>

                  ₹
                  {formatMoney(
                    recommendation
                      .recommendation
                      .grossRevenue
                  )}

                </strong>

              </div>


              <div>

                <span>
                  {t("netPrice")}
                </span>

                <strong>

                  ₹
                  {formatMoney(
                    recommendation
                      .recommendation
                      .netPricePerQuintal
                  )}

                  <small>
                    /{t("quintal")}
                  </small>

                </strong>

              </div>

            </div>


            {/* MANDI STATUS */}

            <div className="mandi-message">

              <strong>

                {getMandiStatusText(
                  recommendation
                    .recommendation
                    .mandiStatus
                )}

              </strong>

              {recommendation
                .recommendation
                .mandiDifferencePercent !==
                null && (

                <span>

                  {" ("}

                  {recommendation
                    .recommendation
                    .mandiDifferencePercent > 0
                    ? "+"
                    : ""}

                  {Number(
                    recommendation
                      .recommendation
                      .mandiDifferencePercent
                  ).toFixed(2)}

                  % {t("vsMandiBenchmark")})

                </span>

              )}

            </div>


            {/* AI TREND STATUS */}

            {recommendation
              .recommendation
              .aiDifferencePercent !==
              null && (

              <div className="prediction">

                <p className="eyebrow">

                  🤖{" "}
                  {t("aiMarketOutlook")}

                </p>

                {(() => {
                  const trend =
                    getAITrendText(
                      recommendation
                        .recommendation
                        .aiDifferencePercent
                    );

                  return (
                    <>
                      <strong>
                        {trend.title}
                      </strong>

                      <small>
                        {trend.description}
                      </small>
                    </>
                  );
                })()}

              </div>

            )}


            {/* NET PROFIT */}

            <div className="net-profit-box">

              <span>
                💰{" "}
                {t("estimatedNetProfit")}
              </span>

              <strong>

                ₹
                {formatMoney(
                  recommendation
                    .recommendation
                    .estimatedNetProfit
                )}

              </strong>

            </div>


            {/* FORMULA */}

            <p className="recommend-formula">
              {recommendation.formula}
            </p>


            {recommendation.note && (

              <small className="recommend-note">

                ℹ️ {recommendation.note}

              </small>

            )}

          </div>

        )}


        {/* MARKET COMPARISON */}

        {recommendation?.options?.length > 0 && (

          <div className="recommend-options">

            <h3>
              {t("marketComparison")}
            </h3>

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      {t("market")}
                    </th>

                    <th>
                      {t("currentPrice")}
                    </th>

                    <th>
                      {t("mandi")}
                    </th>

                    <th>
                      {t("aiPrediction")}
                    </th>

                    <th>
                      {t("distance")}
                    </th>

                    <th>
                      {t("transport")}
                    </th>

                    <th>
                      {t("estimatedNetProfit")}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recommendation.options.map(
                    (option, index) => (

                      <tr
                        key={`${option.market}-${index}`}
                      >

                        <td>

                          {index === 0 && (
                            <span>
                              🏆{" "}
                            </span>
                          )}

                          {option.market}

                        </td>


                        <td>

                          ₹
                          {formatMoney(
                            option
                              .currentPricePerQuintal
                          )}

                        </td>


                        <td>

                          ₹
                          {formatMoney(
                            option
                              .mandiBenchmarkPerQuintal
                          )}

                        </td>


                        <td>

                          ₹
                          {formatMoney(
                            option
                              .aiPredictedPricePerQuintal
                          )}

                        </td>


                        <td>

                          {formatMoney(
                            option.distanceKm
                          )}{" "}
                          km

                        </td>


                        <td>

                          ₹
                          {formatMoney(
                            option.transportCost
                          )}

                        </td>


                        <td>

                          <strong>

                            ₹
                            {formatMoney(
                              option
                                .estimatedNetProfit
                            )}

                          </strong>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


        {/* AI PRICE PREDICTION */}

        {prediction && (

          <div className="prediction">

            <p className="eyebrow">

              🤖{" "}
              {t("aiPricePrediction")}

            </p>

            <strong>

              {t(
                "predictedPriceAfter7Days"
              )}: ₹

              {formatMoney(
                prediction.predictedPrice
              )}

              /{t("quintal")}

            </strong>

            <small>

              {t("model")}:{" "}

              {prediction.model ||
                prediction.source}

            </small>

            {prediction.message && (

              <small>
                {prediction.message}
              </small>

            )}

          </div>

        )}

      </section>

    </main>
  );
}

