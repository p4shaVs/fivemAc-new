// Sunucu başına açılıp kapatılabilen güvenlik kuralları (toggle).
// Referans panellerdeki Yapılandırma / Güvenlik Kuralları sekmesini karşılar.
// Değerler server.config.rules altında JSON olarak saklanır; FiveM kaynağı
// heartbeat ile bu ayarları alıp uygular.

export interface RuleDef {
  key: string;
  label: string;
  description: string;
  default: boolean;
}
export interface RuleGroup {
  id: string;
  label: string;
  icon: string; // Icons key
  description: string;
  rules: RuleDef[];
}

export const RULE_GROUPS: RuleGroup[] = [
  {
    id: "executor",
    label: "Executor Tespiti",
    icon: "terminal",
    description: "Hile executor ve enjeksiyonlarını tespit edip engeller",
    rules: [
      { key: "executor_1", label: "Executor Tespiti #1", description: "Bilinen executor imzaları", default: true },
      { key: "executor_2", label: "Executor Tespiti #2", description: "Bellek enjeksiyon taraması", default: true },
      { key: "executor_3", label: "Executor Tespiti #3", description: "Native hook tespiti", default: true },
      { key: "executor_4", label: "Executor Tespiti #4", description: "Anormal thread davranışı", default: true },
      { key: "executor_5", label: "Executor Tespiti #5", description: "Runtime bütünlük kontrolü", default: true },
      { key: "executor_6", label: "Executor Tespiti #6 (Önerilmez)", description: "Agresif mod — yanlış pozitif riski", default: false },
      { key: "anti_cheat_menu", label: "Anti Cheat Menu (dolaylı)", description: "Zayıf sinyal — tek başına ban atmaz, tehdit skoruna eklenir", default: true },
    ],
  },
  {
    id: "client",
    label: "Client Tespiti",
    icon: "shield",
    description: "Client taraflı hileleri ve exploit'leri engeller",
    rules: [
      { key: "anti_lua_menu", label: "Anti LUA Menü", description: "Lua tabanlı hile menüleri", default: true },
      { key: "anti_teleport", label: "Anti Teleport", description: "İzinsiz ışınlanma", default: true },
      { key: "anti_noclip", label: "Anti NoClip", description: "Duvarlardan geçme", default: true },
      { key: "anti_freecam", label: "Anti FreeCam", description: "Serbest kamera hilesi", default: true },
      { key: "anti_speedhack", label: "Anti Speed Hack", description: "Hız hilesi", default: true },
      { key: "anti_spectate", label: "Anti Spectate", description: "İzinsiz izleme", default: true },
      { key: "anti_invisibility", label: "Anti Invisibility", description: "Görünmezlik", default: false },
      { key: "anti_superjump", label: "Anti Super Jump", description: "Aşırı zıplama", default: true },
      { key: "anti_infinite_stamina", label: "Anti Infinite Stamina", description: "Sonsuz dayanıklılık", default: true },
      { key: "anti_model_change", label: "Anti Model Change", description: "İzinsiz model değişimi", default: true },
      { key: "anti_afk_bypass", label: "Anti AFK Bypass", description: "AFK atlatma", default: true },
    ],
  },
  {
    id: "health",
    label: "Sağlık Tespiti",
    icon: "activity",
    description: "Can ve hasar manipülasyonunu engeller",
    rules: [
      { key: "anti_health_regen", label: "Anti Health Regeneration", description: "Otomatik can yenileme", default: true },
      { key: "anti_health_mod", label: "Anti Health Stat Modification", description: "Can değeri değiştirme", default: true },
      { key: "anti_invincibility", label: "Anti Invincibility", description: "Yenilmezlik (godmode)", default: true },
      { key: "anti_damage_immunity", label: "Anti Damage Immunity", description: "Hasar bağışıklığı", default: true },
      { key: "anti_fall_damage", label: "Anti Fall Damage Immunity", description: "Yüksekten düşüp hasar almama (rapor)", default: true },
      { key: "anti_armor_regen", label: "Anti Armor Regeneration", description: "Kalkan pickup'sız yenileniyor (rapor)", default: true },
      { key: "anti_vehicle_godmode", label: "Anti Vehicle Godmode", description: "Aracın hasar almaması", default: true },
      { key: "anti_instant_repair", label: "Anti Instant Repair", description: "Anlık araç onarımı (rapor)", default: true },
    ],
  },
  {
    id: "weapons",
    label: "Silahlar",
    icon: "bolt",
    description: "İzinsiz silah ve modifikasyonları engeller",
    rules: [
      { key: "anti_illegal_weapon", label: "Anti Illegal Weapon", description: "İzinsiz silah spawn", default: true },
      { key: "anti_weapon_mod", label: "Anti Weapon Modification", description: "Silah damage/clip modu", default: true },
      { key: "anti_rapid_fire", label: "Anti Rapid Fire", description: "Hızlı ateş hilesi", default: true },
      { key: "anti_no_recoil", label: "Anti No Recoil", description: "Geri tepmesiz atış (yalnızca raporlar)", default: false },
      { key: "anti_no_reload", label: "Anti No Reload", description: "Şarjör bitmeden/yeniden dolmadan ateş", default: true },
      { key: "anti_infinite_ammo", label: "Anti Infinite Ammo", description: "Sonsuz mermi", default: true },
      { key: "anti_explosive_bullets", label: "Anti Explosive Bullets", description: "Patlayıcı mermi", default: true },
      { key: "anti_damage_multiplier", label: "Anti Damage Multiplier", description: "Hasar çarpanı limiti", default: true },
      { key: "anti_aimbot", label: "Anti Aimbot", description: "Otomatik nişan", default: true },
      { key: "anti_silent_aim", label: "Anti Silent Aim", description: "Gizli nişan", default: true },
      { key: "anti_wallhack", label: "Anti Wallhack / ESP", description: "Görüş hattı olmadan isabet (rapor)", default: true },
    ],
  },
  {
    id: "entities",
    label: "Nesneler",
    icon: "cube",
    description: "İzinsiz araç, ped ve nesne spawn'larını engeller",
    rules: [
      { key: "anti_vehicle_spawn", label: "Anti Illegal Vehicle", description: "İzinsiz araç spawn", default: true },
      { key: "anti_ped_spawn", label: "Anti Illegal Ped", description: "İzinsiz ped spawn", default: true },
      { key: "anti_object_spawn", label: "Anti Illegal Object", description: "İzinsiz nesne spawn", default: true },
      { key: "anti_entity_spam", label: "Anti Entity Spam", description: "Nesne spam koruması", default: true },
      { key: "anti_give_all_weapons", label: "Anti Give All Weapons", description: "Envanterde anormal silah artışı", default: true },
      { key: "anti_out_of_bounds", label: "Anti Out of Bounds", description: "Harita dışına/geçersiz koordinata ışınlanma", default: true },
    ],
  },
  {
    id: "explosions",
    label: "Patlamalar",
    icon: "bolt",
    description: "İzinsiz patlama ve hasarları engeller",
    rules: [
      { key: "anti_explosion_spam", label: "Anti Explosion Spam", description: "Patlama spam'ı", default: true },
      { key: "anti_owned_explosion", label: "Anti Unauthorized Explosion", description: "İzinsiz patlama kaynağı", default: true },
      { key: "anti_ptfx_spam", label: "Anti PTFX Spam", description: "Efekt spam'ı", default: false },
    ],
  },
  {
    id: "events",
    label: "Event Koruması",
    icon: "shieldCheck",
    description: "Sunucu event exploit'lerini filtreler",
    rules: [
      { key: "server_event_protection", label: "Server Event Protection", description: "Sunucu event trigger koruması", default: true },
      { key: "client_event_protection", label: "Client Event Protection", description: "Client event koruması", default: true },
      { key: "export_protection", label: "Export Protection", description: "İzinsiz export çağrıları", default: true },
      { key: "anti_event_flood", label: "Anti Event Flood", description: "Event flood koruması", default: true },
      { key: "anti_reconnect_spam", label: "Anti Reconnect Spam", description: "Kısa sürede sık giriş/çıkış (bypass denemesi)", default: true },
      { key: "anti_resource_mismatch", label: "Anti Resource Mismatch", description: "İzin listesi dışı client kaynağı (opsiyonel allowlist gerekir)", default: false },
      { key: "anti_chat_flood", label: "Anti Chat Flood", description: "Sohbet spam koruması", default: true },
    ],
  },
];

/** Tüm kuralların varsayılan değerlerini döndürür. */
export function defaultRules(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const g of RULE_GROUPS) for (const r of g.rules) out[r.key] = r.default;
  return out;
}

const ALL_KEYS = new Set(RULE_GROUPS.flatMap((g) => g.rules.map((r) => r.key)));

/** Gelen değerleri temizler: sadece bilinen anahtarlar, boolean değerler. */
export function sanitizeRules(input: unknown): Record<string, boolean> {
  const base = defaultRules();
  if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (ALL_KEYS.has(k) && typeof v === "boolean") base[k] = v;
    }
  }
  return base;
}
