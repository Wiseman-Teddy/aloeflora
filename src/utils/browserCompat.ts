/**
 * browserCompat.ts
 * Cross-browser utilities and polyfills ensuring flawless rendering and UX across:
 * Chrome, Safari (macOS & iOS), Firefox, Edge, Samsung Internet, Opera, and Android WebViews.
 */

/**
 * Copies text to clipboard safely with fallback for older browsers or non-HTTPS contexts
 */
export async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback using textarea + execCommand
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn("Clipboard fallback failed:", err);
    return false;
  }
}

/**
 * Safe localStorage wrapper that handles Safari Private Browsing / disabled cookies without throwing
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false;
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Formats a currency amount into standard KES with fallback for browsers with partial Intl support
 */
export function formatKES(amount: number | string): string {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `KES ${num.toLocaleString()}`;
  }
}
