// import { useEffect, useState } from "react";
// import api from "../services/api";
// import { useAuth } from "../context/AuthContext";
// import { useTranslation } from "react-i18next";
// import { getOfflineOrders } from "../services/offlineStorage";
// import { useOffline } from "../context/useOffline";

// export default function Dashboard() {
//   const { user } = useAuth();
//   const { t } = useTranslation();
//   const { isOnline, syncing } = useOffline();

//   const [offlineOrders, setOfflineOrders] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [crops, setCrops] = useState([]);
//   const [products, setProducts] = useState([]);

//   const [orderMandiPrices, setOrderMandiPrices] = useState({});
//   const [orderMandiLoading, setOrderMandiLoading] = useState({});
//   const [orderMandiErrors, setOrderMandiErrors] = useState({});

//   const [editingProduct, setEditingProduct] = useState(null);

//   const [form, setForm] = useState({
//     crop: "",
//     quantity: 100,
//     unit: "kg",
//     pricePerUnit: 20,
//     description: "",
//     location: ""
//   });

//   // ===============================
//   // LOAD DATA
//   // ===============================
//   useEffect(() => {
//     loadOrders();

//     api
//       .get("/crops")
//       .then(res => {
//         console.log("CROPS FROM API:", res.data);

//         setCrops(res.data);

//         // Automatically select first crop
//         if (res.data && res.data.length > 0) {
//           setForm(f => ({
//             ...f,
//             crop: res.data[0]._id
//           }));
//         }
//       })
//       .catch(err => {
//         console.error(
//           "CROP LOAD ERROR:",
//           err.response?.data || err
//         );

//         setCrops([]);
//       });

//     if (user?.role === "farmer") {
//       loadProducts();
//     }
//   }, [user]);

//   // ===============================
//   // OFFLINE ORDERS CHECK
//   // ===============================
//   useEffect(() => {
//     const checkOfflineOrders = () => {
//       const savedOrders = getOfflineOrders();
//       setOfflineOrders(savedOrders);
//     };

//     checkOfflineOrders();

//     const timer = setInterval(
//       checkOfflineOrders,
//       1000
//     );

//     return () => clearInterval(timer);
//   }, [isOnline, syncing]);

//   // ===============================
//   // LOAD ORDERS
//   // ===============================
//   const loadOrders = async () => {
//     try {
//       const res = await api.get("/buyer/orders");
//       setOrders(res.data);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   // ===============================
//   // LOAD FARMER PRODUCTS
//   // ===============================
//   // ===============================
//   // MANDI BENCHMARK FOR FARMER ORDERS
//   // ===============================
//   const checkOrderMandi = async order => {
//     if (!isOnline || user?.role !== "farmer") return;

//     const crop = order.product?.crop?.name;
//     if (!crop || orderMandiLoading[crop]) return;

//     setOrderMandiLoading(prev => ({ ...prev, [crop]: true }));
//     setOrderMandiErrors(prev => ({ ...prev, [crop]: "" }));

//     try {
//       const district =
//         user?.location?.district ||
//         order.product?.location ||
//         "";

//       const res = await api.get("/markets/mandi", {
//         params: {
//           crop,
//           ...(district ? { district } : {})
//         }
//       });

//       setOrderMandiPrices(prev => ({
//         ...prev,
//         [crop]: res.data
//       }));
//     } catch (err) {
//       console.error("Mandi benchmark error:", err);

//       setOrderMandiErrors(prev => ({
//         ...prev,
//         [crop]:
//           err.response?.data?.message ||
//           "Mandi benchmark unavailable"
//       }));
//     } finally {
//       setOrderMandiLoading(prev => ({
//         ...prev,
//         [crop]: false
//       }));
//     }
//   };

//   const getOrderComparison = order => {
//     const crop = order.product?.crop?.name;
//     const data = orderMandiPrices[crop];

//     if (!data?.benchmarkPricePerQuintal) return null;

//     const benchmark = Number(data.benchmarkPricePerQuintal);
//     const quantity = Number(order.quantity);
//     const total = Number(order.totalAmount);
//     const unit = String(order.product?.unit || "").toLowerCase();

//     if (!benchmark || !quantity || !Number.isFinite(total)) return null;

//     const pricePerUnit = total / quantity;
//     let pricePerQuintal;

//     if (unit === "kg" || unit === "kilogram" || unit === "kilograms") {
//       pricePerQuintal = pricePerUnit * 100;
//     } else if (unit === "quintal" || unit === "quintals") {
//       pricePerQuintal = pricePerUnit;
//     } else if (unit === "ton" || unit === "tonne" || unit === "tonnes") {
//       pricePerQuintal = pricePerUnit / 10;
//     } else {
//       return null;
//     }

//     const differencePercent =
//       ((pricePerQuintal - benchmark) / benchmark) * 100;

//     return {
//       benchmark,
//       differencePercent
//     };
//   };

//   const loadProducts = async () => {
//     try {
//       const res = await api.get(
//         "/buyer/my-products"
//       );

//       setProducts(res.data);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   // ===============================
//   // ADD PRODUCT
//   // ===============================
//   const addProduct = async e => {
//     e.preventDefault();

//     // Prevent empty crop submission
//     if (!form.crop) {
//       alert(
//         "Please select a crop before publishing."
//       );
//       return;
//     }

//     // Make sure crop exists in loaded crop list
//     const selectedCrop = crops.find(
//       crop => crop._id === form.crop
//     );

//     if (!selectedCrop) {
//       alert(
//         "Please select a valid crop."
//       );
//       return;
//     }

//     try {
//       await api.post(
//         "/buyer/products",
//         {
//           crop: form.crop,
//           quantity: Number(form.quantity),
//           unit: form.unit,
//           pricePerUnit: Number(
//             form.pricePerUnit
//           ),
//           description: form.description,
//           location: form.location
//         }
//       );

//       alert(
//         t("productListedSuccessfully") ||
//         "Product listed successfully."
//       );

//       setForm(f => ({
//         ...f,
//         quantity: 100,
//         pricePerUnit: 20,
//         description: "",
//         location: ""
//       }));

//       loadProducts();

//     } catch (err) {
//       console.error(
//         "ADD PRODUCT ERROR:",
//         err.response?.data || err
//       );

//       alert(
//         err.response?.data?.message ||
//         t("couldNotListProduct") ||
//         "Could not list product."
//       );
//     }
//   };

//   // ===============================
//   // DELETE PRODUCT
//   // ===============================
//   const deleteProduct = async id => {
//     const confirmDelete = window.confirm(
//       t("confirmRemoveProduct") ||
//       "Are you sure you want to remove this product?"
//     );

//     if (!confirmDelete) return;

//     try {
//       await api.delete(
//         `/buyer/products/${id}`
//       );

//       alert(
//         t("productRemovedSuccessfully") ||
//         "Product removed successfully."
//       );

//       loadProducts();

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//         "Could not remove product"
//       );
//     }
//   };

//   // ===============================
//   // START EDIT
//   // ===============================
//   const startEdit = product => {
//     setEditingProduct({
//       ...product,
//       crop:
//         product.crop?._id ||
//         product.crop ||
//         ""
//     });
//   };

//   // ===============================
//   // UPDATE PRODUCT
//   // ===============================
//   const updateProduct = async e => {
//     e.preventDefault();

//     if (!editingProduct?.crop) {
//       alert(
//         "Please select a crop before saving."
//       );
//       return;
//     }

//     try {
//       await api.put(
//         `/buyer/products/${editingProduct._id}`,
//         {
//           crop: editingProduct.crop,
//           quantity: Number(
//             editingProduct.quantity
//           ),
//           unit: editingProduct.unit,
//           pricePerUnit: Number(
//             editingProduct.pricePerUnit
//           ),
//           description:
//             editingProduct.description,
//           location:
//             editingProduct.location
//         }
//       );

//       alert(
//         t("productUpdatedSuccessfully") ||
//         "Product updated successfully."
//       );

//       setEditingProduct(null);

//       loadProducts();

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//         "Could not update product"
//       );
//     }
//   };

//   // ===============================
//   // UPDATE ORDER
//   // ===============================
//   const updateOrder = async (
//     id,
//     status
//   ) => {
//     try {
//       await api.patch(
//         `/buyer/orders/${id}`,
//         { status }
//       );

//       loadOrders();

//       if (user?.role === "farmer") {
//         loadProducts();
//       }

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//         "Could not update order"
//       );
//     }
//   };

//   return (
//     <main>

//       {/* =================================
//           WELCOME
//       ================================= */}
//       <section className="card welcome">

//         <p className="eyebrow">
//           {t("dashboard")}
//         </p>

//         <h2>
//           {t("welcome")}, {user?.name}
//         </h2>

//         <p>
//           {t("role")}:{" "}
//           <b>{user?.role}</b> •{" "}
//           {user?.location?.district ||
//             t("maharashtra")}
//         </p>

//       </section>


//       {/* =================================
//           FARMER SECTION
//       ================================= */}
//       {user?.role === "farmer" && (
//         <>

//           {/* =================================
//               LIST PRODUCT
//           ================================= */}
//           <section className="card">

//             <h3>
//               {t("listYourProduce")}
//             </h3>

//             <form
//               className="product-form"
//               onSubmit={addProduct}
//             >

//               {/* Crop */}
//               <label>
//                 {t("crop")}

//                 <select
//                   value={form.crop}
//                   onChange={e =>
//                     setForm({
//                       ...form,
//                       crop:
//                         e.target.value
//                     })
//                   }
//                   required
//                 >

//                   <option value="">
//                     {crops.length === 0
//                       ? "No crops available"
//                       : "Select a crop"}
//                   </option>

//                   {crops.map(c => (
//                     <option
//                       key={c._id}
//                       value={c._id}
//                     >
//                       {c.name}
//                     </option>
//                   ))}

//                 </select>

//               </label>


//               {/* Quantity */}
//               <label>
//                 {t("quantity")} (
//                 {form.unit}
//                 )

//                 <input
//                   type="number"
//                   min="1"
//                   value={form.quantity}
//                   onChange={e =>
//                     setForm({
//                       ...form,
//                       quantity:
//                         Number(
//                           e.target.value
//                         )
//                     })
//                   }
//                   required
//                 />

//               </label>


//               {/* Unit */}
//               <label>
//                 {t("unit")}

//                 <select
//                   value={form.unit}
//                   onChange={e =>
//                     setForm({
//                       ...form,
//                       unit:
//                         e.target.value
//                     })
//                   }
//                 >

//                   <option value="kg">
//                     kg
//                   </option>

//                   <option value="quintal">
//                     {t("quintal")}
//                   </option>

//                   <option value="ton">
//                     {t("ton")}
//                   </option>

//                 </select>

//               </label>


//               {/* Price */}
//               <label>
//                 {t("pricePerUnit")}{" "}
//                 (₹/{form.unit})

//                 <input
//                   type="number"
//                   min="0"
//                   value={
//                     form.pricePerUnit
//                   }
//                   onChange={e =>
//                     setForm({
//                       ...form,
//                       pricePerUnit:
//                         Number(
//                           e.target.value
//                         )
//                     })
//                   }
//                   required
//                 />

//               </label>


//               {/* Location */}
//               <label>
//                 {t("location")}

//                 <input
//                   placeholder={t(
//                     "locationExample"
//                   )}
//                   value={form.location}
//                   onChange={e =>
//                     setForm({
//                       ...form,
//                       location:
//                         e.target.value
//                     })
//                   }
//                 />

//               </label>


//               {/* Description */}
//               <label>
//                 {t("description")}

//                 <input
//                   placeholder={t(
//                     "descriptionExample"
//                   )}
//                   value={
//                     form.description
//                   }
//                   onChange={e =>
//                     setForm({
//                       ...form,
//                       description:
//                         e.target.value
//                     })
//                   }
//                 />

//               </label>


//               <button
//                 className="btn"
//                 type="submit"
//               >
//                 {t("publishProduct")}
//               </button>

//             </form>

//           </section>


//           {/* =================================
//               MY PRODUCTS
//           ================================= */}
//           <section className="card">

//             <h3>
//               {t("myProducts") ||
//                 "My Products"}
//             </h3>

//             {products.length === 0 ? (

//               <p>
//                 {t("noProductsYet") ||
//                   "You have not listed any products yet."}
//               </p>

//             ) : (

//               <div className="grid three">

//                 {products.map(product => (

//                   <div
//                     className="card"
//                     key={product._id}
//                   >

//                     <div className="crop-icon">
//                       🌱
//                     </div>

//                     <h3>
//                       {product.crop?.name ||
//                         "Product"}
//                     </h3>

//                     <p>
//                       <b>
//                         ₹
//                         {
//                           product.pricePerUnit
//                         }
//                       </b>{" "}
//                       / {product.unit}
//                     </p>

//                     <p>
//                       {t("available") ||
//                         "Available"}:{" "}
//                       {product.quantity}{" "}
//                       {product.unit}
//                     </p>

//                     <p>
//                       {t("location")}:{" "}
//                       {product.location ||
//                         "—"}
//                     </p>

//                     <p>
//                       {product.description ||
//                         "—"}
//                     </p>

//                     <p>
//                       {t("status") ||
//                         "Status"}:{" "}
//                       <span className="badge">
//                         {product.status}
//                       </span>
//                     </p>


//                     <div className="actions">

//                       <button
//                         className="btn"
//                         onClick={() =>
//                           startEdit(product)
//                         }
//                       >
//                         {t("edit") ||
//                           "Edit"}
//                       </button>


//                       <button
//                         className="btn secondary"
//                         onClick={() =>
//                           deleteProduct(
//                             product._id
//                           )
//                         }
//                       >
//                         {t("remove") ||
//                           "Remove"}
//                       </button>

//                     </div>

//                   </div>

//                 ))}

//               </div>

//             )}

//           </section>


//           {/* =================================
//               EDIT PRODUCT
//           ================================= */}
//           {editingProduct && (

//             <section className="card">

//               <h3>
//                 {t("editProduct") ||
//                   "Edit Product"}
//               </h3>

//               <form
//                 className="product-form"
//                 onSubmit={updateProduct}
//               >

//                 {/* Crop */}
//                 <label>
//                   {t("crop")}

//                   <select
//                     value={
//                       editingProduct.crop ||
//                       ""
//                     }
//                     onChange={e =>
//                       setEditingProduct({
//                         ...editingProduct,
//                         crop:
//                           e.target.value
//                       })
//                     }
//                     required
//                   >

//                     <option value="">
//                       Select a crop
//                     </option>

//                     {crops.map(c => (
//                       <option
//                         key={c._id}
//                         value={c._id}
//                       >
//                         {c.name}
//                       </option>
//                     ))}

//                   </select>

//                 </label>


//                 {/* Quantity */}
//                 <label>
//                   {t("quantity")}

//                   <input
//                     type="number"
//                     min="1"
//                     value={
//                       editingProduct.quantity
//                     }
//                     onChange={e =>
//                       setEditingProduct({
//                         ...editingProduct,
//                         quantity:
//                           Number(
//                             e.target.value
//                           )
//                       })
//                     }
//                     required
//                   />

//                 </label>


//                 {/* Unit */}
//                 <label>
//                   {t("unit")}

//                   <select
//                     value={
//                       editingProduct.unit
//                     }
//                     onChange={e =>
//                       setEditingProduct({
//                         ...editingProduct,
//                         unit:
//                           e.target.value
//                       })
//                     }
//                   >

//                     <option value="kg">
//                       kg
//                     </option>

//                     <option value="quintal">
//                       {t("quintal")}
//                     </option>

//                     <option value="ton">
//                       {t("ton")}
//                     </option>

//                   </select>

//                 </label>


//                 {/* Price */}
//                 <label>
//                   {t("pricePerUnit")}

//                   <input
//                     type="number"
//                     min="0"
//                     value={
//                       editingProduct.pricePerUnit
//                     }
//                     onChange={e =>
//                       setEditingProduct({
//                         ...editingProduct,
//                         pricePerUnit:
//                           Number(
//                             e.target.value
//                           )
//                       })
//                     }
//                     required
//                   />

//                 </label>


//                 {/* Location */}
//                 <label>
//                   {t("location")}

//                   <input
//                     value={
//                       editingProduct.location ||
//                       ""
//                     }
//                     onChange={e =>
//                       setEditingProduct({
//                         ...editingProduct,
//                         location:
//                           e.target.value
//                       })
//                     }
//                   />

//                 </label>


//                 {/* Description */}
//                 <label>
//                   {t("description")}

//                   <input
//                     value={
//                       editingProduct.description ||
//                       ""
//                     }
//                     onChange={e =>
//                       setEditingProduct({
//                         ...editingProduct,
//                         description:
//                           e.target.value
//                       })
//                     }
//                   />

//                 </label>


//                 <div className="actions">

//                   <button
//                     className="btn"
//                     type="submit"
//                   >
//                     {t("saveChanges") ||
//                       "Save Changes"}
//                   </button>


//                   <button
//                     type="button"
//                     className="btn secondary"
//                     onClick={() =>
//                       setEditingProduct(
//                         null
//                       )
//                     }
//                   >
//                     {t("cancel") ||
//                       "Cancel"}
//                   </button>

//                 </div>

//               </form>

//             </section>

//           )}

//         </>
//       )}


//       {/* =================================
//           ORDERS
//       ================================= */}
//       <section className="card">

//         <h3>
//           {user?.role === "buyer"
//             ? t("myPurchaseRequests")
//             : t("incomingOrders")}
//         </h3>


//         {orders.length === 0 ? (

//           <p>
//             {t("noOrdersYet")}
//           </p>

//         ) : (

//           <table>

//             <thead>

//               <tr>

//                 <th>
//                   {t("product")}
//                 </th>

//                 <th>
//                   {t("quantity")}
//                 </th>

//                 <th>
//                   {t("total")}
//                 </th>

//                 {user?.role === "farmer" && (
//                   <th>Mandi Benchmark</th>
//                 )}

//                 <th>
//                   {t("status")}
//                 </th>

//                 {user?.role ===
//                   "farmer" && (
//                   <th>
//                     {t("action")}
//                   </th>
//                 )}

//               </tr>

//             </thead>


//             <tbody>

//               {orders.map(o => (

//                 <tr key={o._id}>

//                   <td>
//                     {o.product?.crop?.name ||
//                       t("product")}
//                   </td>

//                   <td>
//                     {o.quantity}{" "}
//                     {o.product?.unit || ""}
//                   </td>

//                   <td>
//                     ₹{o.totalAmount}
//                   </td>

//                   {user?.role === "farmer" && (
//                     <td>
//                       {!isOnline ? (
//                         <small>
//                           📡 Unavailable offline
//                         </small>
//                       ) : !orderMandiPrices[o.product?.crop?.name] &&
//                         !orderMandiLoading[o.product?.crop?.name] &&
//                         !orderMandiErrors[o.product?.crop?.name] ? (
//                         <button
//                           type="button"
//                           className="mandi-check-btn"
//                           onClick={() => checkOrderMandi(o)}
//                         >
//                           🏪 Check Mandi
//                         </button>
//                       ) : orderMandiLoading[o.product?.crop?.name] ? (
//                         <small>Checking...</small>
//                       ) : orderMandiErrors[o.product?.crop?.name] ? (
//                         <small className="mandi-order-error">
//                           ⚠️ Benchmark unavailable
//                         </small>
//                       ) : (
//                         (() => {
//                           const comparison = getOrderComparison(o);

//                           if (!comparison) {
//                             return (
//                               <small>
//                                 Benchmark unavailable
//                               </small>
//                             );
//                           }

//                           const pct = comparison.differencePercent;

//                           return (
//                             <div className="mandi-order-comparison">
//                               <small>
//                                 Mandi: ₹
//                                 {comparison.benchmark.toLocaleString("en-IN")}
//                                 /q
//                               </small>

//                               <strong
//                                 className={
//                                   pct < -5
//                                     ? "mandi-order-low"
//                                     : "mandi-order-good"
//                                 }
//                               >
//                                 {pct < -5
//                                   ? `🔴 ${Math.abs(pct).toFixed(1)}% below`
//                                   : pct > 5
//                                   ? `🟢 ${pct.toFixed(1)}% above`
//                                   : "🟢 Close to mandi"}
//                               </strong>
//                             </div>
//                           );
//                         })()
//                       )}
//                     </td>
//                   )}

//                   <td>
//                     <span className="badge">
//                       {t(o.status) ||
//                         o.status}
//                     </span>
//                   </td>


//                   {user?.role ===
//                     "farmer" && (

//                     <td>

//                       {o.status ===
//                         "pending" && (

//                         <>

//                           <button
//                             onClick={() =>
//                               updateOrder(
//                                 o._id,
//                                 "accepted"
//                               )
//                             }
//                           >
//                             {t("accept")}
//                           </button>

//                           {" "}

//                           <button
//                             onClick={() =>
//                               updateOrder(
//                                 o._id,
//                                 "rejected"
//                               )
//                             }
//                           >
//                             {t("reject")}
//                           </button>

//                         </>

//                       )}

//                     </td>

//                   )}

//                 </tr>

//               ))}

//             </tbody>

//           </table>

//         )}

//       </section>


//       {/* =================================
//           OFFLINE PURCHASE REQUESTS
//       ================================= */}
//       {(offlineOrders.length > 0 ||
//         !isOnline ||
//         syncing) && (

//         <section className="card">

//           <h3>
//             📡{" "}
//             {t(
//               "offlinePurchaseRequests"
//             )}
//           </h3>


//           {!isOnline && (
//             <p>
//               {t(
//                 "offlineNewRequestsSaved"
//               )}
//             </p>
//           )}


//           {syncing && (
//             <p>
//               🔄{" "}
//               {t("offlineSyncing")}
//             </p>
//           )}


//           {offlineOrders.length > 0 && (

//             <div>

//               <p>
//                 🛒{" "}
//                 <b>
//                   {offlineOrders.length}
//                 </b>{" "}

//                 {offlineOrders.length > 1
//                   ? t(
//                       "offlinePurchaseWaitingPlural"
//                     )
//                   : t(
//                       "offlinePurchaseWaiting"
//                     )}
//               </p>


//               {offlineOrders.map(
//                 order => (

//                   <div
//                     key={order.offlineId}
//                     className="recommend"
//                   >

//                     <p>
//                       <b>
//                         {t(
//                           "offlineProductId"
//                         )}
//                         :
//                       </b>{" "}
//                       {order.productId}
//                     </p>


//                     <p>
//                       <b>
//                         {t(
//                           "offlineQuantity"
//                         )}
//                         :
//                       </b>{" "}
//                       {order.quantity}
//                     </p>


//                     <p>
//                       <b>
//                         {t(
//                           "offlineStatus"
//                         )}
//                         :
//                       </b>{" "}

//                       <span className="badge">
//                         ⏳{" "}
//                         {t(
//                           "offlineWaitingToSync"
//                         )}
//                       </span>

//                     </p>

//                   </div>

//                 )
//               )}

//             </div>

//           )}


//           {isOnline &&
//             !syncing &&
//             offlineOrders.length ===
//               0 && (

//               <p>
//                 ✅{" "}
//                 {t("offlineAllSynced")}
//               </p>

//             )}

//         </section>

//       )}

//     </main>
//   );
// }





import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { getOfflineOrders } from "../services/offlineStorage";
import { useOffline } from "../context/useOffline";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isOnline, syncing } = useOffline();

  const [offlineOrders, setOfflineOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [crops, setCrops] = useState([]);
  const [products, setProducts] = useState([]);

  // ===============================
  // MANDI BENCHMARK STATE
  // ===============================
  const [orderMandiPrices, setOrderMandiPrices] = useState({});
  const [orderMandiLoading, setOrderMandiLoading] = useState({});
  const [orderMandiErrors, setOrderMandiErrors] = useState({});

  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState({
    crop: "",
    quantity: 100,
    unit: "kg",
    pricePerUnit: 20,
    description: "",
    location: ""
  });

  // ===============================
  // LOAD DATA
  // ===============================
  useEffect(() => {
    loadOrders();

    api
      .get("/crops")
      .then(res => {
        console.log("CROPS FROM API:", res.data);

        setCrops(res.data);

        if (res.data && res.data.length > 0) {
          setForm(f => ({
            ...f,
            crop: res.data[0]._id
          }));
        }
      })
      .catch(err => {
        console.error(
          "CROP LOAD ERROR:",
          err.response?.data || err
        );

        setCrops([]);
      });

    if (user?.role === "farmer") {
      loadProducts();
    }
  }, [user]);

  // ===============================
  // OFFLINE ORDERS CHECK
  // ===============================
  useEffect(() => {
    const checkOfflineOrders = () => {
      const savedOrders = getOfflineOrders();
      setOfflineOrders(savedOrders);
    };

    checkOfflineOrders();

    const timer = setInterval(
      checkOfflineOrders,
      1000
    );

    return () => clearInterval(timer);
  }, [isOnline, syncing]);

  // ===============================
  // LOAD ORDERS
  // ===============================
  const loadOrders = async () => {
    try {
      const res = await api.get("/buyer/orders");
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ===============================
  // LOAD FARMER PRODUCTS
  // ===============================
  const loadProducts = async () => {
    try {
      const res = await api.get(
        "/buyer/my-products"
      );

      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ===============================
  // MANDI BENCHMARK FOR FARMER ORDERS
  // ===============================
  const checkOrderMandi = async order => {
    if (
      !isOnline ||
      user?.role !== "farmer"
    ) {
      return;
    }

    const crop =
      order.product?.crop?.name;

    if (!crop) {
      return;
    }

    // Use crop + district as cache key
    const district =
      user?.location?.district ||
      order.product?.location ||
      "Nashik";

    const mandiKey =
      `${crop}_${district}`.toLowerCase();

    if (orderMandiLoading[mandiKey]) {
      return;
    }

    setOrderMandiLoading(prev => ({
      ...prev,
      [mandiKey]: true
    }));

    setOrderMandiErrors(prev => ({
      ...prev,
      [mandiKey]: ""
    }));

    try {
      console.log(
        "CHECKING MANDI:",
        {
          crop,
          district
        }
      );

      const res = await api.get(
        "/market-prices/mandi",
        {
          params: {
            crop,
            district
          }
        }
      );

      console.log(
        "MANDI BENCHMARK RECEIVED:",
        res.data
      );

      setOrderMandiPrices(prev => ({
        ...prev,
        [mandiKey]: res.data
      }));

    } catch (err) {
      console.error(
        "MANDI BENCHMARK ERROR:",
        err.response?.data || err
      );

      setOrderMandiErrors(prev => ({
        ...prev,
        [mandiKey]:
          err.response?.data?.message ||
          "Mandi benchmark unavailable"
      }));

    } finally {
      setOrderMandiLoading(prev => ({
        ...prev,
        [mandiKey]: false
      }));
    }
  };

  // ===============================
  // COMPARE BUYER OFFER WITH MANDI
  // ===============================
  const getOrderComparison = order => {
    const crop =
      order.product?.crop?.name;

    const district =
      user?.location?.district ||
      order.product?.location ||
      "Nashik";

    const mandiKey =
      `${crop}_${district}`.toLowerCase();

    const data =
      orderMandiPrices[mandiKey];

    if (
      !data?.benchmarkPricePerQuintal
    ) {
      return null;
    }

    const benchmark =
      Number(
        data.benchmarkPricePerQuintal
      );

    const quantity =
      Number(order.quantity);

    const total =
      Number(order.totalAmount);

    const unit =
      String(
        order.product?.unit || ""
      ).toLowerCase();

    if (
      !benchmark ||
      !quantity ||
      !Number.isFinite(total)
    ) {
      return null;
    }

    // Buyer offer price per unit
    const pricePerUnit =
      total / quantity;

    let pricePerQuintal;

    // Convert everything to ₹/quintal
    if (
      unit === "kg" ||
      unit === "kilogram" ||
      unit === "kilograms"
    ) {
      pricePerQuintal =
        pricePerUnit * 100;

    } else if (
      unit === "quintal" ||
      unit === "quintals"
    ) {
      pricePerQuintal =
        pricePerUnit;

    } else if (
      unit === "ton" ||
      unit === "tonne" ||
      unit === "tonnes"
    ) {
      pricePerQuintal =
        pricePerUnit / 10;

    } else {
      return null;
    }

    const differencePercent =
      (
        (pricePerQuintal - benchmark) /
        benchmark
      ) * 100;

    return {
      benchmark,
      buyerPricePerQuintal:
        pricePerQuintal,
      differencePercent
    };
  };

  // ===============================
  // ADD PRODUCT
  // ===============================
  const addProduct = async e => {
    e.preventDefault();

    if (!form.crop) {
      alert(
        "Please select a crop before publishing."
      );
      return;
    }

    const selectedCrop =
      crops.find(
        crop => crop._id === form.crop
      );

    if (!selectedCrop) {
      alert(
        "Please select a valid crop."
      );
      return;
    }

    try {
      await api.post(
        "/buyer/products",
        {
          crop: form.crop,
          quantity:
            Number(form.quantity),
          unit: form.unit,
          pricePerUnit:
            Number(
              form.pricePerUnit
            ),
          description:
            form.description,
          location:
            form.location
        }
      );

      alert(
        t(
          "productListedSuccessfully"
        ) ||
        "Product listed successfully."
      );

      setForm(f => ({
        ...f,
        quantity: 100,
        pricePerUnit: 20,
        description: "",
        location: ""
      }));

      loadProducts();

    } catch (err) {
      console.error(
        "ADD PRODUCT ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        t("couldNotListProduct") ||
        "Could not list product."
      );
    }
  };

  // ===============================
  // DELETE PRODUCT
  // ===============================
  const deleteProduct = async id => {
    const confirmDelete =
      window.confirm(
        t("confirmRemoveProduct") ||
        "Are you sure you want to remove this product?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(
        `/buyer/products/${id}`
      );

      alert(
        t(
          "productRemovedSuccessfully"
        ) ||
        "Product removed successfully."
      );

      loadProducts();

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Could not remove product"
      );
    }
  };

  // ===============================
  // START EDIT
  // ===============================
  const startEdit = product => {
    setEditingProduct({
      ...product,
      crop:
        product.crop?._id ||
        product.crop ||
        ""
    });
  };

  // ===============================
  // UPDATE PRODUCT
  // ===============================
  const updateProduct = async e => {
    e.preventDefault();

    if (!editingProduct?.crop) {
      alert(
        "Please select a crop before saving."
      );
      return;
    }

    try {
      await api.put(
        `/buyer/products/${editingProduct._id}`,
        {
          crop:
            editingProduct.crop,
          quantity:
            Number(
              editingProduct.quantity
            ),
          unit:
            editingProduct.unit,
          pricePerUnit:
            Number(
              editingProduct.pricePerUnit
            ),
          description:
            editingProduct.description,
          location:
            editingProduct.location
        }
      );

      alert(
        t(
          "productUpdatedSuccessfully"
        ) ||
        "Product updated successfully."
      );

      setEditingProduct(null);

      loadProducts();

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Could not update product"
      );
    }
  };

  // ===============================
  // UPDATE ORDER
  // ===============================
  const updateOrder = async (
    id,
    status
  ) => {
    try {
      await api.patch(
        `/buyer/orders/${id}`,
        { status }
      );

      loadOrders();

      if (
        user?.role === "farmer"
      ) {
        loadProducts();
      }

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Could not update order"
      );
    }
  };

  return (
    <main>

      {/* =================================
          WELCOME
      ================================= */}
      <section className="card welcome">

        <p className="eyebrow">
          {t("dashboard")}
        </p>

        <h2>
          {t("welcome")},{" "}
          {user?.name}
        </h2>

        <p>
          {t("role")}:{" "}
          <b>{user?.role}</b> •{" "}
          {user?.location?.district ||
            t("maharashtra")}
        </p>

      </section>


      {/* =================================
          FARMER SECTION
      ================================= */}
      {user?.role === "farmer" && (
        <>

          {/* =================================
              LIST PRODUCT
          ================================= */}
          <section className="card">

            <h3>
              {t("listYourProduce")}
            </h3>

            <form
              className="product-form"
              onSubmit={addProduct}
            >

              <label>
                {t("crop")}

                <select
                  value={form.crop}
                  onChange={e =>
                    setForm({
                      ...form,
                      crop:
                        e.target.value
                    })
                  }
                  required
                >

                  <option value="">
                    {crops.length === 0
                      ? "No crops available"
                      : "Select a crop"}
                  </option>

                  {crops.map(c => (
                    <option
                      key={c._id}
                      value={c._id}
                    >
                      {c.name}
                    </option>
                  ))}

                </select>

              </label>


              <label>
                {t("quantity")} (
                {form.unit}
                )

                <input
                  type="number"
                  min="1"
                  value={
                    form.quantity
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      quantity:
                        Number(
                          e.target.value
                        )
                    })
                  }
                  required
                />

              </label>


              <label>
                {t("unit")}

                <select
                  value={form.unit}
                  onChange={e =>
                    setForm({
                      ...form,
                      unit:
                        e.target.value
                    })
                  }
                >

                  <option value="kg">
                    kg
                  </option>

                  <option value="quintal">
                    {t("quintal")}
                  </option>

                  <option value="ton">
                    {t("ton")}
                  </option>

                </select>

              </label>


              <label>
                {t("pricePerUnit")}{" "}
                (₹/{form.unit})

                <input
                  type="number"
                  min="0"
                  value={
                    form.pricePerUnit
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      pricePerUnit:
                        Number(
                          e.target.value
                        )
                    })
                  }
                  required
                />

              </label>


              <label>
                {t("location")}

                <input
                  placeholder={t(
                    "locationExample"
                  )}
                  value={
                    form.location
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      location:
                        e.target.value
                    })
                  }
                />

              </label>


              <label>
                {t("description")}

                <input
                  placeholder={t(
                    "descriptionExample"
                  )}
                  value={
                    form.description
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      description:
                        e.target.value
                    })
                  }
                />

              </label>


              <button
                className="btn"
                type="submit"
              >
                {t("publishProduct")}
              </button>

            </form>

          </section>


          {/* =================================
              MY PRODUCTS
          ================================= */}
          <section className="card">

            <h3>
              {t("myProducts") ||
                "My Products"}
            </h3>

            {products.length === 0 ? (

              <p>
                {t("noProductsYet") ||
                  "You have not listed any products yet."}
              </p>

            ) : (

              <div className="grid three">

                {products.map(
                  product => (

                    <div
                      className="card"
                      key={
                        product._id
                      }
                    >

                      <div className="crop-icon">
                        🌱
                      </div>

                      <h3>
                        {
                          product.crop
                            ?.name ||
                          "Product"
                        }
                      </h3>

                      <p>
                        <b>
                          ₹
                          {
                            product.pricePerUnit
                          }
                        </b>{" "}
                        /{" "}
                        {product.unit}
                      </p>

                      <p>
                        {t(
                          "available"
                        ) ||
                          "Available"}
                        :{" "}
                        {
                          product.quantity
                        }{" "}
                        {
                          product.unit
                        }
                      </p>

                      <p>
                        {t(
                          "location"
                        )}
                        :{" "}
                        {
                          product.location ||
                          "—"
                        }
                      </p>

                      <p>
                        {
                          product.description ||
                          "—"
                        }
                      </p>

                      <p>
                        {t("status") ||
                          "Status"}
                        :{" "}
                        <span className="badge">
                          {
                            product.status
                          }
                        </span>
                      </p>


                      <div className="actions">

                        <button
                          className="btn"
                          onClick={() =>
                            startEdit(
                              product
                            )
                          }
                        >
                          {t("edit") ||
                            "Edit"}
                        </button>


                        <button
                          className="btn secondary"
                          onClick={() =>
                            deleteProduct(
                              product._id
                            )
                          }
                        >
                          {t("remove") ||
                            "Remove"}
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>


          {/* =================================
              EDIT PRODUCT
          ================================= */}
          {editingProduct && (

            <section className="card">

              <h3>
                {t("editProduct") ||
                  "Edit Product"}
              </h3>

              <form
                className="product-form"
                onSubmit={
                  updateProduct
                }
              >

                <label>
                  {t("crop")}

                  <select
                    value={
                      editingProduct.crop ||
                      ""
                    }
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        crop:
                          e.target.value
                      })
                    }
                    required
                  >

                    <option value="">
                      Select a crop
                    </option>

                    {crops.map(c => (
                      <option
                        key={c._id}
                        value={c._id}
                      >
                        {c.name}
                      </option>
                    ))}

                  </select>

                </label>


                <label>
                  {t("quantity")}

                  <input
                    type="number"
                    min="1"
                    value={
                      editingProduct.quantity
                    }
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        quantity:
                          Number(
                            e.target.value
                          )
                      })
                    }
                    required
                  />

                </label>


                <label>
                  {t("unit")}

                  <select
                    value={
                      editingProduct.unit
                    }
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        unit:
                          e.target.value
                      })
                    }
                  >

                    <option value="kg">
                      kg
                    </option>

                    <option value="quintal">
                      {t("quintal")}
                    </option>

                    <option value="ton">
                      {t("ton")}
                    </option>

                  </select>

                </label>


                <label>
                  {t("pricePerUnit")}

                  <input
                    type="number"
                    min="0"
                    value={
                      editingProduct.pricePerUnit
                    }
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        pricePerUnit:
                          Number(
                            e.target.value
                          )
                      })
                    }
                    required
                  />

                </label>


                <label>
                  {t("location")}

                  <input
                    value={
                      editingProduct.location ||
                      ""
                    }
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        location:
                          e.target.value
                      })
                    }
                  />

                </label>


                <label>
                  {t("description")}

                  <input
                    value={
                      editingProduct.description ||
                      ""
                    }
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        description:
                          e.target.value
                      })
                    }
                  />

                </label>


                <div className="actions">

                  <button
                    className="btn"
                    type="submit"
                  >
                    {t("saveChanges") ||
                      "Save Changes"}
                  </button>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setEditingProduct(
                        null
                      )
                    }
                  >
                    {t("cancel") ||
                      "Cancel"}
                  </button>

                </div>

              </form>

            </section>

          )}

        </>
      )}


      {/* =================================
          ORDERS
      ================================= */}
      <section className="card">

        <h3>
          {user?.role === "buyer"
            ? t(
                "myPurchaseRequests"
              )
            : t(
                "incomingOrders"
              )}
        </h3>


        {orders.length === 0 ? (

          <p>
            {t("noOrdersYet")}
          </p>

        ) : (

          <table>

            <thead>

              <tr>

                <th>
                  {t("product")}
                </th>

                <th>
                  {t("quantity")}
                </th>

                <th>
                  {t("total")}
                </th>

                {user?.role ===
                  "farmer" && (
                  <th>
                    Mandi Benchmark
                  </th>
                )}

                <th>
                  {t("status")}
                </th>

                {user?.role ===
                  "farmer" && (
                  <th>
                    {t("action")}
                  </th>
                )}

              </tr>

            </thead>


            <tbody>

              {orders.map(o => {

                const crop =
                  o.product?.crop?.name;

                const district =
                  user?.location?.district ||
                  o.product?.location ||
                  "Nashik";

                const mandiKey =
                  `${crop}_${district}`.toLowerCase();

                return (
                  <tr
                    key={o._id}
                  >

                    <td>
                      {
                        crop ||
                        t("product")
                      }
                    </td>

                    <td>
                      {o.quantity}{" "}
                      {
                        o.product?.unit ||
                        ""
                      }
                    </td>

                    <td>
                      ₹
                      {
                        o.totalAmount
                      }
                    </td>


                    {/* ===============================
                        MANDI BENCHMARK
                    =============================== */}
                    {user?.role ===
                      "farmer" && (

                      <td>

                        {!isOnline ? (

                          <small>
                            📡 Unavailable offline
                          </small>

                        ) : !orderMandiPrices[
                            mandiKey
                          ] &&
                          !orderMandiLoading[
                            mandiKey
                          ] &&
                          !orderMandiErrors[
                            mandiKey
                          ] ? (

                          <button
                            type="button"
                            className="mandi-check-btn"
                            onClick={() =>
                              checkOrderMandi(
                                o
                              )
                            }
                          >
                            🏪 Check Mandi
                          </button>

                        ) : orderMandiLoading[
                            mandiKey
                          ] ? (

                          <small>
                            Checking...
                          </small>

                        ) : orderMandiErrors[
                            mandiKey
                          ] ? (

                          <small className="mandi-order-error">
                            ⚠️ Benchmark unavailable
                          </small>

                        ) : (

                          (() => {

                            const comparison =
                              getOrderComparison(
                                o
                              );

                            if (
                              !comparison
                            ) {
                              return (
                                <small>
                                  Benchmark unavailable
                                </small>
                              );
                            }

                            const pct =
                              comparison.differencePercent;

                            return (
                              <div className="mandi-order-comparison">

                                <small>
                                  Mandi: ₹
                                  {comparison.benchmark.toLocaleString(
                                    "en-IN"
                                  )}
                                  /q
                                </small>

                                <strong
                                  className={
                                    pct < -5
                                      ? "mandi-order-low"
                                      : "mandi-order-good"
                                  }
                                >

                                  {pct < -5
                                    ? `🔴 ${Math.abs(
                                        pct
                                      ).toFixed(
                                        1
                                      )}% below`
                                    : pct > 5
                                    ? `🟢 ${pct.toFixed(
                                        1
                                      )}% above`
                                    : "🟢 Close to mandi"}

                                </strong>

                              </div>
                            );

                          })()

                        )}

                      </td>
                    )}


                    <td>

                      <span className="badge">
                        {t(o.status) ||
                          o.status}
                      </span>

                    </td>


                    {user?.role ===
                      "farmer" && (

                      <td>

                        {o.status ===
                          "pending" && (

                          <>

                            <button
                              onClick={() =>
                                updateOrder(
                                  o._id,
                                  "accepted"
                                )
                              }
                            >
                              {t("accept")}
                            </button>

                            {" "}

                            <button
                              onClick={() =>
                                updateOrder(
                                  o._id,
                                  "rejected"
                                )
                              }
                            >
                              {t("reject")}
                            </button>

                          </>

                        )}

                      </td>

                    )}

                  </tr>
                );
              })}

            </tbody>

          </table>

        )}

      </section>


      {/* =================================
          OFFLINE PURCHASE REQUESTS
      ================================= */}
      {(
        offlineOrders.length > 0 ||
        !isOnline ||
        syncing
      ) && (

        <section className="card">

          <h3>
            📡{" "}
            {t(
              "offlinePurchaseRequests"
            )}
          </h3>


          {!isOnline && (
            <p>
              {t(
                "offlineNewRequestsSaved"
              )}
            </p>
          )}


          {syncing && (
            <p>
              🔄{" "}
              {t("offlineSyncing")}
            </p>
          )}


          {offlineOrders.length > 0 && (

            <div>

              <p>
                🛒{" "}
                <b>
                  {
                    offlineOrders.length
                  }
                </b>{" "}

                {offlineOrders.length > 1
                  ? t(
                      "offlinePurchaseWaitingPlural"
                    )
                  : t(
                      "offlinePurchaseWaiting"
                    )}

              </p>


              {offlineOrders.map(
                order => (

                  <div
                    key={
                      order.offlineId
                    }
                    className="recommend"
                  >

                    <p>
                      <b>
                        {
                          t(
                            "offlineProductId"
                          )
                        }
                        :
                      </b>{" "}
                      {
                        order.productId
                      }
                    </p>


                    <p>
                      <b>
                        {
                          t(
                            "offlineQuantity"
                          )
                        }
                        :
                      </b>{" "}
                      {
                        order.quantity
                      }
                    </p>


                    <p>
                      <b>
                        {
                          t(
                            "offlineStatus"
                          )
                        }
                        :
                      </b>{" "}

                      <span className="badge">
                        ⏳{" "}
                        {
                          t(
                            "offlineWaitingToSync"
                          )
                        }
                      </span>

                    </p>

                  </div>

                )
              )}

            </div>

          )}


          {isOnline &&
            !syncing &&
            offlineOrders.length ===
              0 && (

            <p>
              ✅{" "}
              {t(
                "offlineAllSynced"
              )}
            </p>

          )}

        </section>

      )}

    </main>
  );
}

