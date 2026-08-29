import { createContext, useEffect, useState } from "react";
import { syncOfflineOrders } from "../services/offlineSync";

export const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(
    navigator.onLine
  );

  const [syncing, setSyncing] = useState(false);

  const syncOrders = async () => {
    if (!navigator.onLine) return;

    try {
      setSyncing(true);

      const result = await syncOfflineOrders();

      console.log("Offline sync result:", result);
    } catch (error) {
      console.error("Offline sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOrders();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Try syncing when application starts
    if (navigator.onLine) {
      syncOrders();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        syncing,
        syncOrders
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}