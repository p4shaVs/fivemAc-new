import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getUserOverview } from "@/lib/stats";
import { StatCard, Card, PageHeader, EmptyState, LinkButton, StatusBadge, Badge } from "@/components/ui";
import { AreaTrend, DonutChart } from "@/components/charts";
import { Icons } from "@/components/icons";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = (await getCurrentUser())!;

  const servers = await db.server.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const serverIds = servers.map((s) => s.id);
  const overview = await getUserOverview(serverIds);

  // Son aktivite: en yeni tespitler
  const recent = serverIds.length
    ? await db.detection.findMany({
        where: { serverId: { in: serverIds } },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
    : [];

  const hasServers = servers.length > 0;

  return (
    <>
      <PageHeader
        title={`Hoş geldin, ${user.username} 👋`}
        description="Sunucularının genel durumu ve son 24 saatteki aktivite."
        actions={
          <LinkButton href="/dashboard/redeem" icon="gift" variant="secondary">
            Kod Kullan
          </LinkButton>
        }
      />

      {!hasServers ? (
        <EmptyState
          icon="server"
          title="Henüz sunucun yok"
          description="Bir lisans anahtarını etkinleştirerek ilk sunucunu koruma altına al."
          action={
            <div className="flex gap-2">
              <LinkButton href="/dashboard/redeem" icon="gift">
                Kod Kullan
              </LinkButton>
              <LinkButton href="/pricing" variant="secondary" icon="cart">
                Lisans Al
              </LinkButton>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Stat kartları */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Aktif Sunucu"
              value={`${overview.onlineServers}/${overview.serverCount}`}
              icon="server"
              accent="brand"
              sub="çevrimiçi"
            />
            <StatCard
              label="Toplam Oyuncu"
              value={overview.totalPlayers.toLocaleString("tr-TR")}
              icon="users"
              accent="violet"
            />
            <StatCard
              label="Toplam Ban"
              value={overview.totalBans}
              icon="ban"
              accent="rose"
              sub={`${overview.activeBans} aktif`}
            />
            <StatCard
              label="Şu An Online"
              value={overview.onlinePlayers}
              icon="activity"
              accent="emerald"
            />
          </div>

          {/* Grafik + tespit donut */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Aktivite Analitiği</h3>
                  <p className="text-xs text-slate-500">Son 24 saat — tespit & yasak</p>
                </div>
                <Badge tone="blue" dot>
                  Canlı
                </Badge>
              </div>
              <AreaTrend data={overview.series} />
            </Card>

            <Card>
              <div className="mb-2 flex items-center gap-2">
                <Icons.shield size={16} className="text-brand-300" />
                <h3 className="text-sm font-semibold text-white">Tespitler</h3>
              </div>
              <p className="mb-3 text-xs text-slate-500">Son 24 saat</p>
              {overview.detectionsByType.length ? (
                <>
                  <DonutChart
                    data={overview.detectionsByType}
                    centerValue={overview.detections24h}
                    centerLabel="tespit"
                  />
                  <ul className="mt-4 space-y-2">
                    {overview.detectionsByType.slice(0, 5).map((d, i) => (
                      <li key={d.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-400">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: DONUT[i % DONUT.length] }}
                          />
                          {d.name}
                        </span>
                        <span className="font-medium text-slate-200">{d.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="grid h-[200px] place-items-center text-center text-sm text-slate-500">
                  Son 24 saatte tespit yok 🎉
                </div>
              )}
            </Card>
          </div>

          {/* Sunucular + son aktivite */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Sunucularım</h3>
                <Link href="/dashboard/servers" className="text-xs text-brand-300 hover:text-brand-200">
                  Tümü →
                </Link>
              </div>
              <div className="space-y-2">
                {servers.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/servers/${s.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-base-900/40 px-4 py-3 transition hover:border-brand-500/20 hover:bg-base-900/70"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-brand-300">
                        <Icons.server size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.ip ?? "IP ayarlanmadı"}</p>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-semibold text-white">Son Tespitler</h3>
              {recent.length ? (
                <ul className="space-y-3">
                  {recent.map((d) => (
                    <li key={d.id} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-300">
                        <Icons.warn size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-200">{d.playerName}</p>
                        <p className="text-xs text-slate-500">
                          {d.type} · {timeAgo(d.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">Aktivite yok</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

const DONUT = ["#6366f1", "#a855f7", "#22d3ee", "#10b981", "#f59e0b", "#f43f5e"];
