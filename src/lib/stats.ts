import { db } from "./db";

// Son 24 saati saatlik kovalara böler (grafik için).
export function emptyHourlyBuckets(): { label: string; ts: number }[] {
  const now = new Date();
  const buckets: { label: string; ts: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    buckets.push({
      label: `${String(d.getHours()).padStart(2, "0")}:00`,
      ts: d.getTime(),
    });
  }
  return buckets;
}

export interface OverviewData {
  serverCount: number;
  onlineServers: number;
  totalPlayers: number;
  onlinePlayers: number;
  activeBans: number;
  totalBans: number;
  detections24h: number;
  actions: { WARN: number; KICK: number; BAN: number };
  detectionsByType: { name: string; value: number }[];
  series: { label: string; players: number; bans: number }[];
}

/** Bir kullanıcının tüm sunucuları için özet metrikler. */
export async function getUserOverview(
  serverIds: string[]
): Promise<OverviewData> {
  if (serverIds.length === 0) {
    return {
      serverCount: 0,
      onlineServers: 0,
      totalPlayers: 0,
      onlinePlayers: 0,
      activeBans: 0,
      totalBans: 0,
      detections24h: 0,
      actions: { WARN: 0, KICK: 0, BAN: 0 },
      detectionsByType: [],
      series: emptyHourlyBuckets().map((b) => ({
        label: b.label,
        players: 0,
        bans: 0,
      })),
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const where = { serverId: { in: serverIds } };

  const [
    servers,
    totalPlayers,
    onlinePlayers,
    activeBans,
    totalBans,
    detections24h,
    detectionRows,
    actionRows,
    banRows,
  ] = await Promise.all([
    db.server.findMany({
      where: { id: { in: serverIds } },
      select: { status: true },
    }),
    db.player.count({ where }),
    db.player.count({ where: { ...where, online: true } }),
    db.ban.count({ where: { ...where, active: true } }),
    db.ban.count({ where }),
    db.detection.count({ where: { ...where, createdAt: { gte: since } } }),
    db.detection.findMany({
      where: { ...where, createdAt: { gte: since } },
      select: { type: true, createdAt: true },
    }),
    db.punishAction.findMany({
      where: { ...where, createdAt: { gte: since } },
      select: { type: true },
    }),
    db.ban.findMany({
      where: { ...where, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  // Tespit türü dağılımı (donut)
  const typeMap = new Map<string, number>();
  for (const d of detectionRows) {
    typeMap.set(d.type, (typeMap.get(d.type) ?? 0) + 1);
  }
  const detectionsByType = Array.from(typeMap.entries())
    .map(([name, value]) => ({ name: detectionTypeLabel(name), value }))
    .sort((a, b) => b.value - a.value);

  // Ceza sayıları
  const actions = { WARN: 0, KICK: 0, BAN: 0 };
  for (const a of actionRows) {
    if (a.type in actions) actions[a.type as keyof typeof actions] += 1;
  }

  // Zaman serisi: saatlik tespit ve ban sayıları (gerçek veriden)
  const buckets = emptyHourlyBuckets();
  const series = buckets.map((b, idx) => {
    const next = idx < buckets.length - 1 ? buckets[idx + 1].ts : Date.now() + 1;
    const players = detectionRows.filter(
      (d) => d.createdAt.getTime() >= b.ts && d.createdAt.getTime() < next
    ).length;
    const bans = banRows.filter(
      (x) => x.createdAt.getTime() >= b.ts && x.createdAt.getTime() < next
    ).length;
    return { label: b.label, players, bans };
  });

  return {
    serverCount: servers.length,
    onlineServers: servers.filter((s) => s.status === "ONLINE").length,
    totalPlayers,
    onlinePlayers,
    activeBans,
    totalBans,
    detections24h,
    actions,
    detectionsByType,
    series,
  };
}

export function detectionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    AIMBOT: "AimBot",
    SILENT_AIM: "Silent Aim",
    OVERLAY: "Overlay",
    ILLEGAL_WEAPON: "Illegal Weapon",
    INVINCIBILITY: "Godmode",
    ILLEGAL_VEHICLE: "Illegal Vehicle",
    SPOOFER: "Spoofer",
    RESOURCE_INJECT: "Resource Inject",
    EVENT_EXPLOIT: "Event Exploit",
    EXPLOSION: "Explosion",
  };
  return map[type] ?? type;
}
