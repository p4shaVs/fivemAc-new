// Her tespit TİPİ için müşterinin seçebileceği aksiyon: LOG (yalnızca kaydet),
// KICK (at) veya BAN (yasakla). Sunucu başına server.config.actions altında
// { [detectionType]: "LOG" | "KICK" | "BAN" } olarak saklanır. FiveM'den gelen
// bir tespit işlenirken (src/app/api/v1/detections/route.ts) bu haritaya
// bakılır; ayar yoksa aşağıdaki varsayılan kullanılır.

export type DetectionAction = "LOG" | "KICK" | "BAN";

export interface DetectionTypeDef {
  type: string;
  label: string;
  category: string;
  defaultAction: DetectionAction;
}

export const DETECTION_CATEGORIES = [
  { id: "movement", label: "Hareket" },
  { id: "combat", label: "Silah / Combat" },
  { id: "survival", label: "Can & Zırh" },
  { id: "visual", label: "Görsel / Kamera" },
  { id: "entity", label: "Nesne / Spawn" },
  { id: "other", label: "Diğer" },
] as const;

export const DETECTION_TYPES: DetectionTypeDef[] = [
  // Hareket
  { type: "NOCLIP", label: "NoClip", category: "movement", defaultAction: "BAN" },
  { type: "TELEPORT", label: "Teleport / Işınlanma", category: "movement", defaultAction: "BAN" },
  { type: "SUPER_JUMP", label: "Super Jump", category: "movement", defaultAction: "BAN" },
  { type: "FLYHACK", label: "Fly Hack (yerçekimsiz uçuş)", category: "movement", defaultAction: "BAN" },
  { type: "SPEED_HACK", label: "Speed Hack (yaya)", category: "movement", defaultAction: "BAN" },
  { type: "VEHICLE_SPEED", label: "Speed Hack (araç)", category: "movement", defaultAction: "BAN" },
  { type: "VEHICLE_NOCLIP", label: "NoClip (araç)", category: "movement", defaultAction: "BAN" },

  // Combat
  { type: "AIMBOT", label: "Aimbot", category: "combat", defaultAction: "BAN" },
  { type: "SILENT_AIM", label: "Silent Aim / Magic Bullet", category: "combat", defaultAction: "BAN" },
  { type: "INFINITE_AMMO", label: "Sonsuz Mermi", category: "combat", defaultAction: "BAN" },
  { type: "NO_RELOAD", label: "Şarjörsüz Ateş", category: "combat", defaultAction: "BAN" },
  { type: "ILLEGAL_WEAPON", label: "İzinsiz Silah Hasarı", category: "combat", defaultAction: "KICK" },
  { type: "DAMAGE_MULTIPLIER", label: "Hasar Çarpanı", category: "combat", defaultAction: "BAN" },
  { type: "EXPLOSIVE_BULLETS", label: "Patlayıcı Mermi", category: "combat", defaultAction: "BAN" },
  { type: "EXPLOSION", label: "Patlama Spam", category: "combat", defaultAction: "LOG" },
  { type: "RAPID_FIRE", label: "Rapid Fire (ateş hızı)", category: "combat", defaultAction: "LOG" },
  { type: "WALLBANG", label: "Wallbang / ESP Göstergesi", category: "combat", defaultAction: "LOG" },
  { type: "NO_RECOIL", label: "No Recoil (geri tepmesiz)", category: "combat", defaultAction: "LOG" },
  { type: "GIVE_ALL_WEAPONS", label: "Give All Weapons", category: "combat", defaultAction: "BAN" },

  // Can & Zırh
  { type: "GODMODE", label: "Godmode / Yenilmezlik", category: "survival", defaultAction: "BAN" },
  { type: "ARMOR_HACK", label: "Zırh Hilesi", category: "survival", defaultAction: "BAN" },
  { type: "ARMOR_REGEN", label: "Kalkan Yenilenmesi (pickup'sız)", category: "survival", defaultAction: "LOG" },
  { type: "NO_FALL_DAMAGE", label: "Düşme Hasarı Bağışıklığı", category: "survival", defaultAction: "LOG" },
  { type: "VEHICLE_GODMODE", label: "Araç Godmode", category: "survival", defaultAction: "BAN" },
  { type: "INSTANT_REPAIR", label: "Anlık Araç Onarımı", category: "survival", defaultAction: "LOG" },
  { type: "OUT_OF_BOUNDS", label: "Harita Dışı / Geçersiz Konum", category: "survival", defaultAction: "BAN" },

  // Görsel / Kamera
  { type: "FREECAM", label: "FreeCam", category: "visual", defaultAction: "LOG" },
  { type: "SPECTATE", label: "İzinsiz Spectate", category: "visual", defaultAction: "KICK" },
  { type: "INFINITE_STAMINA", label: "Sonsuz Dayanıklılık", category: "visual", defaultAction: "LOG" },
  { type: "MODEL_CHANGE", label: "Model Değişimi", category: "visual", defaultAction: "LOG" },
  { type: "PROP_DISGUISE", label: "Prop Disguise (obje kılığı)", category: "visual", defaultAction: "LOG" },
  { type: "INVISIBLE", label: "Görünmezlik", category: "visual", defaultAction: "KICK" },

  // Nesne / Spawn
  { type: "ILLEGAL_VEHICLE", label: "İzinsiz Araç Spawn", category: "entity", defaultAction: "KICK" },
  { type: "ILLEGAL_PED", label: "İzinsiz Ped Spawn", category: "entity", defaultAction: "KICK" },
  { type: "ILLEGAL_OBJECT", label: "İzinsiz Nesne Spawn", category: "entity", defaultAction: "LOG" },
  { type: "BLACKLIST_VEHICLE", label: "Kara Liste Araç", category: "entity", defaultAction: "BAN" },
  { type: "BLACKLIST_PED", label: "Kara Liste Ped", category: "entity", defaultAction: "BAN" },
  { type: "BLACKLIST_OBJECT", label: "Kara Liste Nesne", category: "entity", defaultAction: "KICK" },
  { type: "BLACKLIST_WEAPON", label: "Kara Liste Silah", category: "entity", defaultAction: "BAN" },

  // Diğer
  { type: "RECONNECT_SPAM", label: "Sık Giriş/Çıkış", category: "other", defaultAction: "LOG" },
  { type: "CHAT_FLOOD", label: "Sohbet Spam", category: "other", defaultAction: "KICK" },
  { type: "CHEAT_MENU_SUSPECTED", label: "Hile Menüsü Şüphesi (zayıf sinyal)", category: "other", defaultAction: "LOG" },
  { type: "THREAT_SCORE", label: "Tehdit Skoru (birleşik sinyal)", category: "other", defaultAction: "BAN" },
];

const ALL_TYPES = new Set(DETECTION_TYPES.map((d) => d.type));

/** Her tip için varsayılan aksiyonu döndürür. */
export function defaultActions(): Record<string, DetectionAction> {
  const out: Record<string, DetectionAction> = {};
  for (const d of DETECTION_TYPES) out[d.type] = d.defaultAction;
  return out;
}

/** Gelen değerleri temizler: sadece bilinen tipler, geçerli aksiyon değerleri. */
export function sanitizeActions(input: unknown): Record<string, DetectionAction> {
  const base = defaultActions();
  const valid = new Set(["LOG", "KICK", "BAN"]);
  if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (ALL_TYPES.has(k) && typeof v === "string" && valid.has(v)) {
        base[k] = v as DetectionAction;
      }
    }
  }
  return base;
}

/** Bilinmeyen bir tespit tipi için severity'den makul bir varsayılan aksiyon türetir. */
export function fallbackActionForSeverity(severity: string): DetectionAction {
  if (severity === "CRITICAL") return "BAN";
  if (severity === "HIGH") return "KICK";
  return "LOG";
}

/**
 * Seçilen aksiyonu severity'ye göre tavanlar (GÜVENLİK KEMERİ).
 * Müşteri bir tespit tipi için "BAN" seçmiş olsa bile, o anki rapor CRITICAL
 * değilse ban ATILMAZ — en fazla KICK (HIGH'ta), aksi halde LOG. Böylece bir
 * tespit dosyasının "sadece rapor" niyetiyle HIGH/MEDIUM göndermesi, o tipin
 * varsayılan aksiyonu BAN diye YANLIŞLIKLA banlamaz. Tespit dosyaları CRITICAL
 * göndermeye karar verdiğinde (gerçekten kanıtlanmış anda) ban devreye girer.
 */
function capBySeverity(action: DetectionAction, severity: string): DetectionAction {
  if (action === "BAN") return severity === "CRITICAL" ? "BAN" : capBySeverity("KICK", severity);
  if (action === "KICK") return severity === "HIGH" || severity === "CRITICAL" ? "KICK" : "LOG";
  return "LOG";
}

/** Bir tespit tipi + severity için nihai aksiyonu çözer (config > tip varsayılanı > severity, sonra severity tavanı). */
export function resolveAction(
  actions: Record<string, DetectionAction>,
  type: string,
  severity: string
): DetectionAction {
  let action: DetectionAction;
  if (actions[type]) action = actions[type];
  else {
    const def = DETECTION_TYPES.find((d) => d.type === type);
    action = def ? def.defaultAction : fallbackActionForSeverity(severity);
  }
  return capBySeverity(action, severity);
}
