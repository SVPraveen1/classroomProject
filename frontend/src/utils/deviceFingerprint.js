/**
 * Lightweight device fingerprinting utility.
 * Generates a hash from stable browser/device properties.
 * No external library required.
 */

const getCanvasFingerprint = () => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("GeoAttend", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("GeoAttend", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "";
  }
};

const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Returns a stable device fingerprint string.
 * Combines multiple browser signals that remain consistent across sessions.
 */
export const getDeviceFingerprint = () => {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency || "",
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.maxTouchPoints || 0,
    navigator.platform || "",
    getCanvasFingerprint(),
  ];

  return simpleHash(components.join("|||"));
};
