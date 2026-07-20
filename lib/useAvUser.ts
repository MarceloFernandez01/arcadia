"use client";

import { useSyncExternalStore } from "react";
import { getAvUser, subscribeAvUser } from "./avUser";

function getServerSnapshot() {
  return null;
}

export function useAvUser() {
  return useSyncExternalStore(subscribeAvUser, getAvUser, getServerSnapshot);
}
