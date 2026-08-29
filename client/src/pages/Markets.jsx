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

          // Save crops for offline use
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

          // Cache prices separately for each crop
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
  // LATEST MARKET COMPARISON
  // ==========================================
  const latest = useMemo(() => {
    const map = new Map();

    prices.forEach(p => {
      if (!map.has(p.marketName)) {
        map.set(p.marketName, p);
      }
    });

    return [...map.values()];
  }, [prices]);

  // ==========================================
  // SMART RECOMMENDATION
  // ==========================================
  const recommend = async () => {
    if (!user) {
      return alert(t("pleaseLoginFirst"));
    }

    if (!isOnline) {
      return alert(
        "Internet is required for Smart Selling Recommendation."
      );
    }

    try {
      const { data } = await api.post(
        "/prices/recommendation",
        {
          cropId,
          quantity,
          farmerLocation:
            user.location?.district || ""
        }
      );

      setRecommendation(data);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not get recommendation."
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

    if (!isOnline) {
      return alert(
        "Internet is required for AI price prediction."
      );
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
      alert(
        error.response?.data?.message ||
        "Could not predict price."
      );
    }
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
              📡 Showing previously saved market data
            </p>
          )}
        </div>

        <select
          value={cropId}
          onChange={e =>
            setCropId(e.target.value)
          }
        >
          {crops.map(c => (
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
          MARKET DATA + CHART
      ========================================== */}
      <div className="grid two">

        <section className="card">

          <h3>
            {t("latestMarketComparison")}
          </h3>

          {latest.length === 0 ? (

            <p>
              {isOnline
                ? "No market data available."
                : "No saved market data available offline."}
            </p>

          ) : (

            <table>

              <thead>
                <tr>
                  <th>{t("market")}</th>
                  <th>{t("pricePerQuintal")}</th>
                  <th>{t("district")}</th>
                </tr>
              </thead>

              <tbody>

                {latest.map(p => (

                  <tr key={p._id}>

                    <td>
                      {p.marketName}
                    </td>

                    <td>
                      ₹{p.pricePerQuintal}
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
              No price history available.
            </p>
          )}

        </section>

      </div>

      {/* ==========================================
          SMART SELLING
      ========================================== */}
      <section className="card">

        <h3>
          🧠 {t("smartSellingRecommendation")}
        </h3>

        <div className="inline-form">

          <label>

            {t("quantityQuintal")}

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e =>
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
            📡 Smart recommendation and AI prediction
            require an internet connection.
          </p>
        )}

        {/* RECOMMENDATION */}

        {recommendation && (

          <div className="recommend">

            <h3>
              {t("recommended")}:{" "}
              {recommendation.recommendation.market}
            </h3>

            <p>
              {t("price")}: ₹
              {
                recommendation.recommendation
                  .pricePerQuintal
              }
              /quintal
            </p>

            <p>
              {t("distance")}:{" "}
              {
                recommendation.recommendation
                  .distanceKm
              } km
            </p>

            <p>
              {t("estimatedTransport")}: ₹
              {
                recommendation.recommendation
                  .transportCost
              }
            </p>

            <strong>
              {t("estimatedNetProfit")}: ₹
              {
                recommendation.recommendation
                  .estimatedNetProfit
              }
            </strong>

          </div>

        )}

        {/* PREDICTION */}

        {prediction && (

          <div className="prediction">

            <strong>
              {t("predictedPriceAfter7Days")}: ₹
              {prediction.predictedPrice}/quintal
            </strong>

            <small>
              {t("model")}:{" "}
              {prediction.model ||
                prediction.source}
            </small>

          </div>

        )}

      </section>

    </main>
  );
}