import Product from "../models/Product.js";
import Order from "../models/Order.js";


// ==================================================
// GET ALL ACTIVE PRODUCTS
// ==================================================
export const getProducts = async (req, res) => {
  try {
    const { crop, location, q } = req.query;

    const filter = {
      status: "active"
    };

    if (crop) {
      filter.crop = crop;
    }

    if (location) {
      filter.location = new RegExp(location, "i");
    }

    let query = Product.find(filter)
      .populate("farmer", "name phone location")
      .populate("crop", "name localName unit")
      .sort({ createdAt: -1 });

    let products = await query;

    if (q) {
      const term = q.toLowerCase();

      products = products.filter(
        p =>
          p.crop?.name?.toLowerCase().includes(term) ||
          p.crop?.localName?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ==================================================
// CREATE PRODUCT - FARMER
// ==================================================
export const createProduct = async (req, res) => {
  try {

    const product = await Product.create({
      ...req.body,
      farmer: req.user._id
    });

    res.status(201).json(
      await product.populate(
        "crop",
        "name localName unit"
      )
    );

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};


// ==================================================
// GET FARMER'S OWN PRODUCTS
// ==================================================
export const getMyProducts = async (req, res) => {
  try {

    const products = await Product.find({
      farmer: req.user._id
    })
      .populate(
        "crop",
        "name localName unit"
      )
      .sort({
        createdAt: -1
      });

    res.json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// ==================================================
// UPDATE FARMER'S PRODUCT
// ==================================================
export const updateProduct = async (req, res) => {
  try {

    const product =
      await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Make sure this product belongs
    // to the logged-in farmer
    if (
      String(product.farmer) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        message:
          "You can update only your own products"
      });
    }

    const {
      crop,
      quantity,
      unit,
      pricePerUnit,
      description,
      location,
      imageUrl
    } = req.body;

    if (crop !== undefined)
      product.crop = crop;

    if (quantity !== undefined) {

      if (quantity < 1) {
        return res.status(400).json({
          message:
            "Quantity must be at least 1"
        });
      }

      product.quantity = quantity;

      // If product was sold and farmer
      // adds quantity again
      if (product.status === "sold") {
        product.status = "active";
      }
    }

    if (unit !== undefined)
      product.unit = unit;

    if (pricePerUnit !== undefined) {

      if (pricePerUnit < 0) {
        return res.status(400).json({
          message:
            "Price cannot be negative"
        });
      }

      product.pricePerUnit =
        pricePerUnit;
    }

    if (description !== undefined)
      product.description = description;

    if (location !== undefined)
      product.location = location;

    if (imageUrl !== undefined)
      product.imageUrl = imageUrl;

    await product.save();

    const updatedProduct =
      await Product.findById(product._id)
        .populate(
          "crop",
          "name localName unit"
        );

    res.json(updatedProduct);

  } catch (error) {

    res.status(400).json({
      message: error.message
    });

  }
};


// ==================================================
// DELETE / DEACTIVATE FARMER PRODUCT
// ==================================================
export const deleteProduct = async (req, res) => {
  try {

    const product =
      await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Only owner farmer can remove product
    if (
      String(product.farmer) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        message:
          "You can remove only your own products"
      });
    }

    // Instead of permanently deleting,
    // mark it inactive
    product.status = "inactive";

    await product.save();

    res.json({
      message: "Product removed successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// ==================================================
// BUYER CREATE ORDER
// ==================================================
export const createOrder = async (req, res) => {
  try {

    const {
      productId,
      quantity,
      message
    } = req.body;

    const product =
      await Product.findById(productId);

    if (
      !product ||
      product.status !== "active"
    ) {
      return res.status(404).json({
        message:
          "Product not available"
      });
    }

    if (
      quantity <= 0 ||
      quantity > product.quantity
    ) {
      return res.status(400).json({
        message:
          "Invalid quantity"
      });
    }

    const order = await Order.create({
      product: product._id,
      farmer: product.farmer,
      buyer: req.user._id,
      quantity,
      totalAmount:
        quantity *
        product.pricePerUnit,
      message
    });

    res.status(201).json(
      await order.populate([
        {
          path: "product",
          populate: {
            path: "crop",
            select:
              "name localName unit"
          }
        },
        {
          path: "farmer",
          select:
            "name phone"
        },
        {
          path: "buyer",
          select:
            "name phone"
        }
      ])
    );

  } catch (error) {

    res.status(400).json({
      message: error.message
    });

  }
};


// ==================================================
// GET MY ORDERS
// ==================================================
export const getMyOrders = async (req, res) => {
  try {

    const filter =
      req.user.role === "buyer"
        ? {
            buyer: req.user._id
          }
        : {
            farmer: req.user._id
          };

    const orders =
      await Order.find(filter)

        .populate({
          path: "product",
          populate: {
            path: "crop",
            select:
              "name localName unit"
          }
        })

        .populate(
          "farmer",
          "name phone location"
        )

        .populate(
          "buyer",
          "name phone location"
        )

        .sort({
          createdAt: -1
        });

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// ==================================================
// UPDATE ORDER STATUS
// ==================================================
export const updateOrder = async (req, res) => {
  try {

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        message:
          "Order not found"
      });
    }


    // Only farmer can update order
    if (
      req.user.role !== "farmer" ||
      String(order.farmer) !==
        String(req.user._id)
    ) {

      return res.status(403).json({
        message:
          "Only the farmer can update this order"
      });

    }


    const allowed = [
      "accepted",
      "rejected",
      "completed"
    ];

    if (
      !allowed.includes(
        req.body.status
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid status"
      });

    }


    // ==================================================
    // ACCEPT ORDER
    // ==================================================
    if (
      req.body.status === "accepted" &&
      order.status === "pending"
    ) {

      const product =
        await Product.findById(
          order.product
        );

      if (!product) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }


      // Check available quantity
      if (
        product.quantity <
        order.quantity
      ) {

        return res.status(400).json({
          message:
            "Not enough product quantity available"
        });

      }


      // Reduce quantity
      product.quantity =
        product.quantity -
        order.quantity;


      // If all quantity is sold
      if (
        product.quantity === 0
      ) {

        product.status = "sold";

      }


      await product.save();

    }


    // Update order status
    order.status =
      req.body.status;

    await order.save();


    // Return updated order
    const updatedOrder =
      await Order.findById(
        order._id
      )

        .populate({
          path: "product",
          populate: {
            path: "crop",
            select:
              "name localName unit"
          }
        })

        .populate(
          "farmer",
          "name phone location"
        )

        .populate(
          "buyer",
          "name phone location"
        );


    res.json(updatedOrder);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};