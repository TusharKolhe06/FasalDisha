import express from "express";

import {
  getProducts,
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  createOrder,
  getMyOrders,
  updateOrder
} from "../controllers/buyerController.js";

import {
  protect,
  role
} from "../middleware/authMiddleware.js";

const router = express.Router();


// ===============================
// MARKETPLACE
// ===============================

router.get(
  "/products",
  getProducts
);


// ===============================
// FARMER PRODUCTS
// ===============================

router.post(
  "/products",
  protect,
  role("farmer"),
  createProduct
);

router.get(
  "/my-products",
  protect,
  role("farmer"),
  getMyProducts
);

router.put(
  "/products/:id",
  protect,
  role("farmer"),
  updateProduct
);

router.delete(
  "/products/:id",
  protect,
  role("farmer"),
  deleteProduct
);


// ===============================
// ORDERS
// ===============================

router.post(
  "/orders",
  protect,
  role("buyer"),
  createOrder
);

router.get(
  "/orders",
  protect,
  getMyOrders
);

router.patch(
  "/orders/:id",
  protect,
  updateOrder
);


export default router;