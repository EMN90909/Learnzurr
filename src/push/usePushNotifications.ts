import { useMemo } from "react";
import { PushClient } from "./pushClient";

export function usePushNotifications(apiBaseUrl = "/api") {
  return useMemo(
    () =>
      new PushClient({
        apiBaseUrl,
        serviceWorkerPath: "/push-sw.js",
      }),
    [apiBaseUrl]
  );
}
