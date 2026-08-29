
import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

import {
  saveOfflineData,
  getOfflineData,
  saveOfflineOrder
} from "../services/offlineStorage";

import { useOffline } from "../context/useOffline";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");

  const { user } = useAuth();
  const { t } = useTranslation();
  const { isOnline } = useOffline();

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================
  const load = async () => {
    try {
      if (isOnline) {
        let url = "/buyer/products";

        if (q) {
          url =
            "/buyer/products?q=" +
            encodeURIComponent(q);
        }

        const res = await api.get(url);

        setProducts(res.data);

        // Save products for offline use
        saveOfflineData(
          "marketplace_products",
          res.data
        );

        return;
      }

      // ==========================================
      // OFFLINE → LOAD CACHED PRODUCTS
      // ==========================================
      const cachedProducts =
        getOfflineData("marketplace_products");

      if (cachedProducts) {
        setProducts(cachedProducts);
      } else {
        setProducts([]);
      }

    } catch (error) {
      console.error(
        "Could not load marketplace:",
        error
      );

      // Try cached products if API fails
      const cachedProducts =
        getOfflineData("marketplace_products");

      if (cachedProducts) {
        setProducts(cachedProducts);
      }
    }
  };

  // ==========================================
  // LOAD WHEN INTERNET STATUS CHANGES
  // ==========================================
  useEffect(() => {
    load();
  }, [isOnline]);

  // ==========================================
  // BUY PRODUCT
  // ==========================================
  const buy = async product => {

    if (!user) {
      return alert(
        t("loginAsBuyer")
      );
    }

    if (user.role !== "buyer") {
      return alert(
        t("onlyBuyers")
      );
    }

    // Ask quantity
    const qty = Number(
      prompt(
        `${t("quantityIn")} ${product.unit}:`,
        Math.min(
          10,
          product.quantity
        )
      )
    );

    if (!qty || qty <= 0) {
      return;
    }

    if (qty > product.quantity) {
      return alert(
        t("quantityNotAvailable")
      );
    }

    // ==========================================
    // OFFLINE → SAVE ORDER LOCALLY
    // ==========================================
    if (!isOnline) {

      saveOfflineOrder({
        productId: product._id,
        quantity: qty,
        message:
          "Purchase request from FasalDisha"
      });

      alert(
        "📡 " +
        t("offlinePurchaseSaved") +
        "\n\n" +
        t("offlinePurchaseWillSync")
      );

      return;
    }

    // ==========================================
    // ONLINE → SEND TO SERVER
    // ==========================================
    try {

      await api.post(
        "/buyer/orders",
        {
          productId: product._id,
          quantity: qty,
          message:
            "Purchase request from FasalDisha"
        }
      );

      alert(
        t("purchaseRequestSent")
      );

      // Refresh products
      load();

    } catch (err) {

      alert(
        err.response?.data?.message ||
        t("orderFailed")
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
            {t("directMarketLinkage")}
          </p>

          <h2>
            {t("farmerMarketplace")}
          </h2>

          {!isOnline && (
            <p className="offline-data-note">
              📡 {t("offlineDataNote")}
            </p>
          )}

        </div>

        {/* SEARCH */}

        <div className="search">

          <input
            placeholder={t("searchCrop")}
            value={q}
            onChange={e =>
              setQ(e.target.value)
            }
          />

          <button
            className="btn"
            onClick={load}
          >
            {t("search")}
          </button>

        </div>

      </div>

      {/* ==========================================
          PRODUCTS
      ========================================== */}

      {products.length === 0 ? (

        <section className="card">

          <h3>
            {t("noProductsFound")}
          </h3>

          <p>
            {isOnline
              ? t("tryAnotherCrop")
              : t("offlineNoData")}
          </p>

        </section>

      ) : (

        <div className="grid three">

          {products.map(p => (

            <div
              className="card"
              key={p._id}
            >

              {/* CROP */}

              <div className="crop-icon">
                🌱
              </div>

              <h3>
                {p.crop?.name ||
                  t("product")}
              </h3>

              {/* DESCRIPTION */}

              {p.description && (
                <p>
                  {p.description}
                </p>
              )}

              {/* PRICE */}

              <div>

                <small>
                  {t("pricePerUnit")}
                </small>

                <p>
                  <b>
                    ₹{p.pricePerUnit}
                  </b>{" "}
                  / {p.unit}
                </p>

              </div>

              {/* QUANTITY */}

              <p>
                <b>
                  {t("available")}:
                </b>{" "}
                {p.quantity} {p.unit}
              </p>

              {/* FARMER */}

              <p>
                <b>
                  {t("farmer")}:
                </b>{" "}
                {p.farmer?.name ||
                  "—"}
              </p>

              {/* LOCATION */}

              <p>
                <b>
                  {t("location")}:
                </b>{" "}
                {p.location ||
                  "—"}
              </p>

              {/* BUY */}

              <button
                className="btn"
                onClick={() =>
                  buy(p)
                }
              >
                🛒{" "}
                {t("sendPurchaseRequest")}
              </button>

            </div>

          ))}

        </div>

      )}

    </main>
  );
}
