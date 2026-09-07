// Küçük yardımcılar.

/** Koşullu className birleştirici (clsx'in minimal versiyonu). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatMoney(cents: number, currency = "EUR"): string {
  const symbols: Record<string, string> = { EUR: "€", USD: "$", TRY: "₺", GBP: "£" };
  const sym = symbols[currency] ?? "";
  return `${sym}${(cents / 100).toFixed(2)}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3 gün", "2 saat" gibi kalan süre. */
export function relativeDays(d: Date | string | null | undefined): string {
  if (!d) return "Süresiz";
  const date = typeof d === "string" ? new Date(d) : d;
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return "Süresi doldu";
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days} gün`;
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  return `${hours} saat`;
}

export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "az önce";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  return `${day} gün önce`;
}

export function parseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
