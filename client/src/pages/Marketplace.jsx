// import { useEffect, useState } from "react";
// import api from "../services/api";
// import { useAuth } from "../context/AuthContext";
// import { useTranslation } from "react-i18next";

// import {
//   saveOfflineData,
//   getOfflineData,
//   saveOfflineOrder
// } from "../services/offlineStorage";

// import { useOffline } from "../context/useOffline";

// export default function Marketplace() {
//   const [products, setProducts] = useState([]);
//   const [q, setQ] = useState("");

//   // Mandi benchmark data for products
//   const [mandiPrices, setMandiPrices] = useState({});
//   const [mandiLoading, setMandiLoading] = useState({});
//   const [mandiErrors, setMandiErrors] = useState({});

//   const { user } = useAuth();
//   const { t } = useTranslation();
//   const { isOnline } = useOffline();

//   // ==========================================
//   // LOAD PRODUCTS
//   // ==========================================

//   const load = async () => {
//     try {
//       if (isOnline) {
//         let url = "/buyer/products";

//         if (q) {
//           url =
//             "/buyer/products?q=" +
//             encodeURIComponent(q);
//         }

//         const res = await api.get(url);

//         setProducts(res.data);

//         // Save products for offline use
//         saveOfflineData(
//           "marketplace_products",
//           res.data
//         );

//         return;
//       }

//       // ==========================================
//       // OFFLINE → LOAD CACHED PRODUCTS
//       // ==========================================

//       const cachedProducts =
//         getOfflineData("marketplace_products");

//       if (cachedProducts) {
//         setProducts(cachedProducts);
//       } else {
//         setProducts([]);
//       }

//     } catch (error) {
//       console.error(
//         "Could not load marketplace:",
//         error
//       );

//       // Try cached products if API fails
//       const cachedProducts =
//         getOfflineData("marketplace_products");

//       if (cachedProducts) {
//         setProducts(cachedProducts);
//       }
//     }
//   };

//   // ==========================================
//   // LOAD WHEN INTERNET STATUS CHANGES
//   // ==========================================

//   useEffect(() => {
//     load();
//   }, [isOnline]);

//   // ==========================================
//   // FETCH MANDI BENCHMARK
//   // ==========================================

//   const fetchMandiBenchmark = async (product) => {
//     if (!isOnline) {
//       return;
//     }

//     const cropName =
//       product.crop?.name;

//     if (!cropName) {
//       return;
//     }

//     // Avoid fetching the same crop repeatedly
//     if (
//       mandiPrices[cropName] !== undefined ||
//       mandiLoading[cropName]
//     ) {
//       return;
//     }

//     setMandiLoading(prev => ({
//       ...prev,
//       [cropName]: true
//     }));

//     setMandiErrors(prev => ({
//       ...prev,
//       [cropName]: ""
//     }));

//     try {
//       const district =
//         product.farmer?.location?.district ||
//         user?.location?.district ||
//         "";

//       const res = await api.get(
//         "/markets/mandi",
//         {
//           params: {
//             crop: cropName,
//             ...(district
//               ? { district }
//               : {})
//           }
//         }
//       );

//       setMandiPrices(prev => ({
//         ...prev,
//         [cropName]: res.data
//       }));

//     } catch (error) {
//       console.error(
//         "Could not fetch mandi benchmark:",
//         error
//       );

//       setMandiErrors(prev => ({
//         ...prev,
//         [cropName]:
//           error.response?.data?.message ||
//           "Mandi benchmark unavailable"
//       }));

//     } finally {
//       setMandiLoading(prev => ({
//         ...prev,
//         [cropName]: false
//       }));
//     }
//   };

//   // ==========================================
//   // COMPARE PRODUCT PRICE WITH MANDI
//   // ==========================================

//   const getMandiComparison = (product) => {
//     const cropName =
//       product.crop?.name;

//     const data =
//       mandiPrices[cropName];

//     if (
//       !data ||
//       !data.benchmarkPricePerQuintal
//     ) {
//       return null;
//     }

//     const benchmark =
//       Number(
//         data.benchmarkPricePerQuintal
//       );

//     const productPrice =
//       Number(product.pricePerUnit);

//     if (
//       !Number.isFinite(productPrice) ||
//       !Number.isFinite(benchmark)
//     ) {
//       return null;
//     }

//     const unit =
//       String(product.unit || "")
//         .toLowerCase();

//     // Mandi prices are normally ₹/quintal.
//     // Convert product price to ₹/quintal when possible.
//     let comparablePrice = productPrice;

//     if (
//       unit === "kg" ||
//       unit === "kilogram" ||
//       unit === "kilograms"
//     ) {
//       comparablePrice =
//         productPrice * 100;
//     }

//     // Only compare directly when unit is quintal
//     // or when we can convert kg → quintal.
//     const comparableUnit =
//       unit === "kg" ||
//       unit === "kilogram" ||
//       unit === "kilograms" ||
//       unit === "quintal" ||
//       unit === "quintals";

//     if (!comparableUnit) {
//       return {
//         benchmark,
//         comparable: false
//       };
//     }

//     const difference =
//       comparablePrice - benchmark;

//     const differencePercent =
//       (difference / benchmark) * 100;

//     let status;

//     if (differencePercent >= 5) {
//       status = "BETTER";
//     } else if (differencePercent >= -5) {
//       status = "FAIR";
//     } else {
//       status = "BELOW_MANDI";
//     }

//     return {
//       benchmark,
//       comparable: true,
//       difference,
//       differencePercent,
//       status
//     };
//   };

//   // ==========================================
//   // BUY PRODUCT
//   // ==========================================

//   const buy = async product => {

//     if (!user) {
//       return alert(
//         t("loginAsBuyer")
//       );
//     }

//     if (user.role !== "buyer") {
//       return alert(
//         t("onlyBuyers")
//       );
//     }

//     // Ask quantity
//     const qty = Number(
//       prompt(
//         `${t("quantityIn")} ${product.unit}:`,
//         Math.min(
//           10,
//           product.quantity
//         )
//       )
//     );

//     if (!qty || qty <= 0) {
//       return;
//     }

//     if (qty > product.quantity) {
//       return alert(
//         t("quantityNotAvailable")
//       );
//     }

//     // ==========================================
//     // OFFLINE → SAVE ORDER LOCALLY
//     // ==========================================

//     if (!isOnline) {

//       saveOfflineOrder({
//         productId: product._id,
//         quantity: qty,
//         message:
//           "Purchase request from FasalDisha"
//       });

//       alert(
//         "📡 " +
//         t("offlinePurchaseSaved") +
//         "\n\n" +
//         t("offlinePurchaseWillSync")
//       );

//       return;
//     }

//     // ==========================================
//     // ONLINE → SEND TO SERVER
//     // ==========================================

//     try {

//       await api.post(
//         "/buyer/orders",
//         {
//           productId: product._id,
//           quantity: qty,
//           message:
//             "Purchase request from FasalDisha"
//         }
//       );

//       alert(
//         t("purchaseRequestSent")
//       );

//       // Refresh products
//       load();

//     } catch (err) {

//       alert(
//         err.response?.data?.message ||
//         t("orderFailed")
//       );

//     }
//   };

//   return (
//     <main>

//       {/* ==========================================
//           PAGE HEADER
//       ========================================== */}

//       <div className="page-head">

//         <div>

//           <p className="eyebrow">
//             {t("directMarketLinkage")}
//           </p>

//           <h2>
//             {t("farmerMarketplace")}
//           </h2>

//           {!isOnline && (
//             <p className="offline-data-note">
//               📡 {t("offlineDataNote")}
//             </p>
//           )}

//         </div>

//         {/* SEARCH */}

//         <div className="search">

//           <input
//             placeholder={t("searchCrop")}
//             value={q}
//             onChange={e =>
//               setQ(e.target.value)
//             }
//           />

//           <button
//             className="btn"
//             onClick={load}
//           >
//             {t("search")}
//           </button>

//         </div>

//       </div>

//       {/* ==========================================
//           PRODUCTS
//       ========================================== */}

//       {products.length === 0 ? (

//         <section className="card">

//           <h3>
//             {t("noProductsFound")}
//           </h3>

//           <p>
//             {isOnline
//               ? t("tryAnotherCrop")
//               : t("offlineNoData")}
//           </p>

//         </section>

//       ) : (

//         <div className="grid three">

//           {products.map(p => {

//             const comparison =
//               getMandiComparison(p);

//             const cropName =
//               p.crop?.name;

//             return (

//               <div
//                 className="card"
//                 key={p._id}
//               >

//                 {/* CROP */}

//                 <div className="crop-icon">
//                   🌱
//                 </div>

//                 <h3>
//                   {cropName ||
//                     t("product")}
//                 </h3>

//                 {/* DESCRIPTION */}

//                 {p.description && (
//                   <p>
//                     {p.description}
//                   </p>
//                 )}

//                 {/* PRICE */}

//                 <div>

//                   <small>
//                     {t("pricePerUnit")}
//                   </small>

//                   <p>
//                     <b>
//                       ₹{p.pricePerUnit}
//                     </b>{" "}
//                     / {p.unit}
//                   </p>

//                 </div>

//                 {/* ==================================
//                     MANDI BENCHMARK
//                     ================================== */}

//                 {isOnline && cropName && (
//                   <div className="mandi-offer-box">

//                     <div className="mandi-offer-header">
//                       <span>
//                         🏪 Mandi Benchmark
//                       </span>

//                       {!mandiPrices[cropName] &&
//                         !mandiLoading[cropName] && (
//                           <button
//                             type="button"
//                             className="mandi-check-btn"
//                             onClick={() =>
//                               fetchMandiBenchmark(p)
//                             }
//                           >
//                             Check
//                           </button>
//                         )}
//                     </div>

//                     {mandiLoading[cropName] && (
//                       <p className="mandi-loading">
//                         Fetching government
//                         mandi price...
//                       </p>
//                     )}

//                     {mandiErrors[cropName] && (
//                       <p className="mandi-error">
//                         ⚠️{" "}
//                         {mandiErrors[cropName]}
//                       </p>
//                     )}

//                     {mandiPrices[cropName] &&
//                       !mandiErrors[cropName] && (
//                         <>

//                           <p className="mandi-benchmark-price">
//                             ₹
//                             {Number(
//                               mandiPrices[
//                                 cropName
//                               ]
//                                 .benchmarkPricePerQuintal
//                             ).toLocaleString(
//                               "en-IN"
//                             )}
//                             /quintal
//                           </p>

//                           {comparison?.comparable ? (

//                             <div
//                               className={
//                                 comparison.status ===
//                                 "BELOW_MANDI"
//                                   ? "mandi-status mandi-status-low"
//                                   : "mandi-status mandi-status-good"
//                               }
//                             >

//                               {comparison.status ===
//                               "BELOW_MANDI" ? (
//                                 <>
//                                   🔴 Listed price is{" "}
//                                   {Math.abs(
//                                     comparison
//                                       .differencePercent
//                                   ).toFixed(1)}
//                                   % below mandi benchmark
//                                 </>
//                               ) : comparison.status ===
//                                 "BETTER" ? (
//                                 <>
//                                   🟢 Listed price is{" "}
//                                   {comparison
//                                     .differencePercent
//                                     .toFixed(1)}
//                                   % above mandi benchmark
//                                 </>
//                               ) : (
//                                 <>
//                                   🟢 Listed price is close
//                                   to mandi benchmark
//                                 </>
//                               )}

//                             </div>

//                           ) : (

//                             <p className="mandi-unit-note">
//                               Benchmark available.
//                               Comparison requires
//                               kg or quintal pricing.
//                             </p>

//                           )}

//                         </>
//                       )}

//                   </div>
//                 )}

//                 {/* OFFLINE MANDI NOTE */}

//                 {!isOnline && (
//                   <div className="mandi-offer-box mandi-offline">
//                     📡 Live mandi benchmark
//                     unavailable offline.
//                   </div>
//                 )}

//                 {/* QUANTITY */}

//                 <p>
//                   <b>
//                     {t("available")}:
//                   </b>{" "}
//                   {p.quantity} {p.unit}
//                 </p>

//                 {/* FARMER */}

//                 <p>
//                   <b>
//                     {t("farmer")}:
//                   </b>{" "}
//                   {p.farmer?.name ||
//                     "—"}
//                 </p>

//                 {/* LOCATION */}

//                 <p>
//                   <b>
//                     {t("location")}:
//                   </b>{" "}
//                   {p.location ||
//                     "—"}
//                 </p>

//                 {/* BUY */}

//                 <button
//                   className="btn"
//                   onClick={() =>
//                     buy(p)
//                   }
//                 >
//                   🛒{" "}
//                   {t("sendPurchaseRequest")}
//                 </button>

//               </div>

//             );

//           })}

//         </div>

//       )}

//     </main>
//   );
// }





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

  // Mandi benchmark data for products
  const [mandiPrices, setMandiPrices] = useState({});
  const [mandiLoading, setMandiLoading] = useState({});
  const [mandiErrors, setMandiErrors] = useState({});

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
  // FETCH MANDI BENCHMARK
  // ==========================================

  const fetchMandiBenchmark = async product => {
    if (!isOnline) {
      return;
    }

    const cropName =
      product.crop?.name;

    if (!cropName) {
      return;
    }

    // Get district for government mandi lookup
    const district =
      product.farmer?.location?.district ||
      user?.location?.district ||
      product.location ||
      "Nashik";

    // Use crop + district so benchmarks
    // from different districts don't get mixed.
    const mandiKey =
      `${cropName}_${district}`.toLowerCase();

    // Avoid fetching the same crop/district repeatedly
    if (
      mandiPrices[mandiKey] !== undefined ||
      mandiLoading[mandiKey]
    ) {
      return;
    }

    setMandiLoading(prev => ({
      ...prev,
      [mandiKey]: true
    }));

    setMandiErrors(prev => ({
      ...prev,
      [mandiKey]: ""
    }));

    try {
      console.log(
        "CHECKING MARKETPLACE MANDI:",
        {
          crop: cropName,
          district
        }
      );

      // IMPORTANT:
      // Correct backend endpoint
      const res = await api.get(
        "/market-prices/mandi",
        {
          params: {
            crop: cropName,
            district
          }
        }
      );

      console.log(
        "MARKETPLACE MANDI RECEIVED:",
        res.data
      );

      setMandiPrices(prev => ({
        ...prev,
        [mandiKey]: res.data
      }));

    } catch (error) {
      console.error(
        "Could not fetch mandi benchmark:",
        error.response?.data || error
      );

      setMandiErrors(prev => ({
        ...prev,
        [mandiKey]:
          error.response?.data?.message ||
          "Mandi benchmark unavailable"
      }));

    } finally {
      setMandiLoading(prev => ({
        ...prev,
        [mandiKey]: false
      }));
    }
  };

  // ==========================================
  // COMPARE PRODUCT PRICE WITH MANDI
  // ==========================================

  const getMandiComparison = product => {
    const cropName =
      product.crop?.name;

    const district =
      product.farmer?.location?.district ||
      user?.location?.district ||
      product.location ||
      "Nashik";

    const mandiKey =
      `${cropName}_${district}`.toLowerCase();

    const data =
      mandiPrices[mandiKey];

    if (
      !data ||
      !data.benchmarkPricePerQuintal
    ) {
      return null;
    }

    const benchmark =
      Number(
        data.benchmarkPricePerQuintal
      );

    const productPrice =
      Number(product.pricePerUnit);

    if (
      !Number.isFinite(productPrice) ||
      !Number.isFinite(benchmark)
    ) {
      return null;
    }

    const unit =
      String(product.unit || "")
        .toLowerCase();

    // Mandi prices are ₹/quintal.
    let comparablePrice =
      productPrice;

    if (
      unit === "kg" ||
      unit === "kilogram" ||
      unit === "kilograms"
    ) {
      comparablePrice =
        productPrice * 100;

    } else if (
      unit === "quintal" ||
      unit === "quintals"
    ) {
      comparablePrice =
        productPrice;

    } else if (
      unit === "ton" ||
      unit === "tonne" ||
      unit === "tonnes"
    ) {
      // 1 ton = 10 quintals
      comparablePrice =
        productPrice / 10;
    }

    const comparableUnit =
      unit === "kg" ||
      unit === "kilogram" ||
      unit === "kilograms" ||
      unit === "quintal" ||
      unit === "quintals" ||
      unit === "ton" ||
      unit === "tonne" ||
      unit === "tonnes";

    if (!comparableUnit) {
      return {
        benchmark,
        comparable: false
      };
    }

    const difference =
      comparablePrice - benchmark;

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

    return {
      benchmark,
      comparable: true,
      difference,
      differencePercent,
      status
    };
  };

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

          {products.map(p => {

            const comparison =
              getMandiComparison(p);

            const cropName =
              p.crop?.name;

            const district =
              p.farmer?.location?.district ||
              user?.location?.district ||
              p.location ||
              "Nashik";

            const mandiKey =
              `${cropName}_${district}`.toLowerCase();

            return (

              <div
                className="card"
                key={p._id}
              >

                {/* CROP */}

                <div className="crop-icon">
                  🌱
                </div>

                <h3>
                  {cropName ||
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

                {/* ==================================
                    MANDI BENCHMARK
                    ================================== */}

                {isOnline && cropName && (
                  <div className="mandi-offer-box">

                    <div className="mandi-offer-header">

                      <span>
                        🏪 Mandi Benchmark
                      </span>

                      {!mandiPrices[
                        mandiKey
                      ] &&
                        !mandiLoading[
                          mandiKey
                        ] && (
                          <button
                            type="button"
                            className="mandi-check-btn"
                            onClick={() =>
                              fetchMandiBenchmark(p)
                            }
                          >
                            Check
                          </button>
                        )}

                    </div>

                    {mandiLoading[
                      mandiKey
                    ] && (
                      <p className="mandi-loading">
                        Fetching government
                        mandi price...
                      </p>
                    )}

                    {mandiErrors[
                      mandiKey
                    ] && (
                      <p className="mandi-error">
                        ⚠️{" "}
                        {
                          mandiErrors[
                            mandiKey
                          ]
                        }
                      </p>
                    )}

                    {mandiPrices[
                      mandiKey
                    ] &&
                      !mandiErrors[
                        mandiKey
                      ] && (
                        <>

                          <p className="mandi-benchmark-price">
                            ₹
                            {Number(
                              mandiPrices[
                                mandiKey
                              ]
                                .benchmarkPricePerQuintal
                            ).toLocaleString(
                              "en-IN"
                            )}
                            /quintal
                          </p>

                          {comparison?.comparable ? (

                            <div
                              className={
                                comparison.status ===
                                "BELOW_MANDI"
                                  ? "mandi-status mandi-status-low"
                                  : "mandi-status mandi-status-good"
                              }
                            >

                              {comparison.status ===
                              "BELOW_MANDI" ? (

                                <>
                                  🔴 Listed price is{" "}
                                  {Math.abs(
                                    comparison
                                      .differencePercent
                                  ).toFixed(1)}
                                  % below mandi benchmark
                                </>

                              ) : comparison.status ===
                                "BETTER" ? (

                                <>
                                  🟢 Listed price is{" "}
                                  {comparison
                                    .differencePercent
                                    .toFixed(1)}
                                  % above mandi benchmark
                                </>

                              ) : (

                                <>
                                  🟢 Listed price is close
                                  to mandi benchmark
                                </>

                              )}

                            </div>

                          ) : (

                            <p className="mandi-unit-note">
                              Benchmark available.
                              Comparison requires
                              kg, quintal, or ton
                              pricing.
                            </p>

                          )}

                        </>
                      )}

                  </div>
                )}

                {/* OFFLINE MANDI NOTE */}

                {!isOnline && (
                  <div className="mandi-offer-box mandi-offline">
                    📡 Live mandi benchmark
                    unavailable offline.
                  </div>
                )}

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

            );

          })}

        </div>

      )}

    </main>
  );
}

