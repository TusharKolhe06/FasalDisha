import { useOffline } from "../context/useOffline";
export default function OfflineBanner() {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      📡 You are offline. Some data may be unavailable.
    </div>
  );
}