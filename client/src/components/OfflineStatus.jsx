
import { useEffect, useState } from "react";
import { getOfflineOrders } from "../services/offlineStorage";
import { useOffline } from "../context/useOffline";
import { useTranslation } from "react-i18next";

export default function OfflineStatus() {
  const { isOnline, syncing } = useOffline();
  const { t } = useTranslation();

  const [pending, setPending] = useState(0);

  const checkPending = () => {
    const orders = getOfflineOrders();
    setPending(orders.length);
  };

  useEffect(() => {
    checkPending();

    const timer = setInterval(
      checkPending,
      1000
    );

    return () => clearInterval(timer);
  }, [isOnline, syncing]);

  if (
    isOnline &&
    pending === 0 &&
    !syncing
  ) {
    return null;
  }

  return (
    <div className="offline-status">

      {/* OFFLINE MODE */}
      {!isOnline && (
        <>
          📡{" "}
          <b>
            {t("offlineMode")}
          </b>
        </>
      )}

      {/* PENDING ORDERS */}
      {pending > 0 && (
        <>
          🛒 {pending}{" "}

          {pending > 1
            ? t("offlinePurchaseWaitingPlural")
            : t("offlinePurchaseWaiting")}
        </>
      )}

      {/* SYNCING */}
      {syncing && (
        <>
          🔄{" "}
          {t("offlineSyncing")}
        </>
      )}

    </div>
  );
}
