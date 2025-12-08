export function encodeBase64(data) {
  if (typeof window === "undefined") {
    // Node.js environment
    return Buffer.from(data).toString("base64");
  } else {
    // Browser environment
    return btoa(data);
  }
}
