import api from "./api";
import {
  getOfflineOrders,
  saveOfflineData
} from "./offlineStorage";

export const syncOfflineOrders = async () => {
  const pendingOrders = getOfflineOrders();

  if (!pendingOrders.length) {
    return {
      synced: 0,
      failed: 0
    };
  }

  let synced = 0;
  let failed = 0;

  const remainingOrders = [];

  for (const order of pendingOrders) {
    try {
      await api.post("/buyer/orders", {
        productId: order.productId,
        quantity: order.quantity,
        message: order.message
      });

      synced++;

      console.log(
        "✅ Offline order synced:",
        order.offlineId
      );

    } catch (error) {
      failed++;

      console.error(
        "❌ Could not sync offline order:",
        error
      );

      remainingOrders.push(order);
    }
  }

  saveOfflineData(
    "pending_orders",
    remainingOrders
  );

  return {
    synced,
    failed
  };
};