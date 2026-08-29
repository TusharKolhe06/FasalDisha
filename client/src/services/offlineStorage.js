const STORAGE_PREFIX = "fasaldisha_offline_";

export const saveOfflineData = (key, data) => {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error("Could not save offline data:", error);
  }
};

export const getOfflineData = (key) => {
  try {
    const data = localStorage.getItem(
      `${STORAGE_PREFIX}${key}`
    );

    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Could not read offline data:", error);
    return null;
  }
};

export const removeOfflineData = (key) => {
  localStorage.removeItem(
    `${STORAGE_PREFIX}${key}`
  );
};


// ==========================================
// OFFLINE ORDER QUEUE
// ==========================================

export const getOfflineOrders = () => {
  return getOfflineData("pending_orders") || [];
};


export const saveOfflineOrder = (order) => {
  const orders = getOfflineOrders();

  orders.push({
    ...order,
    offlineId: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
    createdAt: new Date().toISOString(),
    syncStatus: "pending"
  });

  saveOfflineData(
    "pending_orders",
    orders
  );

  return orders;
};


export const clearOfflineOrders = () => {
  removeOfflineData("pending_orders");
};