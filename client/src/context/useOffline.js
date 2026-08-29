import { useContext } from "react";
import { OfflineContext } from "./OfflineContext";

export function useOffline() {
  return useContext(OfflineContext);
}