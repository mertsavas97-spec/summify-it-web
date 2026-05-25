declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type MetaPixelParams = Record<string, unknown> | undefined;

function debugLog(eventName: string) {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[MetaPixel] ${eventName}`);
  }
}

export function trackMetaEvent(eventName: string, params?: MetaPixelParams): void {
  debugLog(eventName);
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (params) {
    window.fbq("track", eventName, params);
    return;
  }
  window.fbq("track", eventName);
}

export function trackMetaCustomEvent(eventName: string, params?: MetaPixelParams): void {
  debugLog(eventName);
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (params) {
    window.fbq("trackCustom", eventName, params);
    return;
  }
  window.fbq("trackCustom", eventName);
}

export {};
