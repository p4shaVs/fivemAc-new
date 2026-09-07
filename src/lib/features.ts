// Anti-cheat özellik kataloğu.
// Admin bir lisans anahtarı üretirken bu özelliklerden seçer; müşteri panelinde
// ve FiveM kaynağı tarafında hangi korumaların açık olduğunu bu liste belirler.

export interface FeatureDef {
  key: string;
  label: string;
  description: string;
  category: "Detection" | "Protection" | "Panel" | "Advanced";
}

export const FEATURES: FeatureDef[] = [
  // --- Tespit (Detection) ---
  {
    key: "aimbot_detection",
    label: "Aimbot Tespiti",
    description: "Anormal nişan alma açısal hızını ve snap davranışını tespit eder.",
    category: "Detection",
  },
  {
    key: "silent_aim_detection",
    label: "Silent Aim Tespiti",
    description: "Sunucu tarafı mermi/hedef tutarsızlığını yakalar.",
    category: "Detection",
  },
  {
    key: "overlay_detection",
    label: "Overlay / ESP Tespiti",
    description: "Bilinen menü/overlay imzalarını ve enjeksiyonları tarar.",
    category: "Detection",
  },
  {
    key: "spoofer_detection",
    label: "Spoofer Tespiti",
    description: "HWID/identifier spoofing girişimlerini işaretler.",
    category: "Detection",
  },
  // --- Koruma (Protection) ---
  {
    key: "weapon_protection",
    label: "Silah Koruması",
    description: "İzinsiz silah spawn/modifikasyonlarını engeller.",
    category: "Protection",
  },
  {
    key: "vehicle_protection",
    label: "Araç Koruması",
    description: "İzinsiz araç spawn ve modlarını engeller.",
    category: "Protection",
  },
  {
    key: "godmode_protection",
    label: "Godmode Koruması",
    description: "Yenilmezlik (invincibility) ve sağlık hilelerini durdurur.",
    category: "Protection",
  },
  {
    key: "resource_protection",
    label: "Kaynak Koruması",
    description: "İzinsiz resource start/stop ve enjeksiyonlarını engeller.",
    category: "Protection",
  },
  {
    key: "event_protection",
    label: "Event Koruması",
    description: "Sunucu event trigger flood ve exploit'lerini filtreler.",
    category: "Protection",
  },
  {
    key: "explosion_protection",
    label: "Patlama Koruması",
    description: "İzinsiz patlama spam'ını sınırlar.",
    category: "Protection",
  },
  // --- Panel ---
  {
    key: "web_panel",
    label: "Web Panel",
    description: "Tarayıcıdan tam yönetim paneli erişimi.",
    category: "Panel",
  },
  {
    key: "ingame_menu",
    label: "Oyun İçi Menü",
    description: "Oyun içi yönetici menüsü (F-tuşu).",
    category: "Panel",
  },
  {
    key: "live_map",
    label: "Canlı Harita",
    description: "Oyuncuların gerçek zamanlı interaktif haritası.",
    category: "Panel",
  },
  {
    key: "player_lookup",
    label: "Oyuncu Sorgulama",
    description: "Identifier'a göre geçmiş ve ceza sorgulama.",
    category: "Panel",
  },
  // --- Gelişmiş (Advanced) ---
  {
    key: "discord_logs",
    label: "Discord Logları",
    description: "Tespit ve cezaları Discord webhook'a iletir.",
    category: "Advanced",
  },
  {
    key: "api_access",
    label: "API Erişimi",
    description: "Kendi entegrasyonlarınız için REST API anahtarları.",
    category: "Advanced",
  },
  {
    key: "auto_ban",
    label: "Otomatik Ban",
    description: "Kritik tespitlerde otomatik yasaklama.",
    category: "Advanced",
  },
  {
    key: "screenshot",
    label: "Uzaktan Ekran Görüntüsü",
    description: "Şüpheli oyunculardan ekran görüntüsü ister.",
    category: "Advanced",
  },
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key);
const FEATURE_SET = new Set(FEATURE_KEYS);

export function isValidFeature(key: string): boolean {
  return FEATURE_SET.has(key);
}

/** Bilinmeyen özellik anahtarlarını temizler ve tekrarları kaldırır. */
export function sanitizeFeatures(features: unknown): string[] {
  if (!Array.isArray(features)) return [];
  return Array.from(
    new Set(features.filter((f): f is string => typeof f === "string" && FEATURE_SET.has(f)))
  );
}

export function featureLabel(key: string): string {
  return FEATURES.find((f) => f.key === key)?.label ?? key;
}
