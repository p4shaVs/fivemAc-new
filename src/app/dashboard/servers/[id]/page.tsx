import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { getUserOverview } from "@/lib/stats";
import { StatCard, Card, Badge, PageHeader, StatusBadge, LinkButton } from "@/components/ui";
import { AreaTrend, DonutChart } from "@/components/charts";
import { Icons } from "@/components/icons";
import { parseJson, timeAgo, relativeDays } from "@/lib/utils";
import { featureLabel } from "@/lib/features";
import { sanitizeRules } from "@/lib/rules";
import { sanitizeActions } from "@/lib/detection-actions";
import { computeSecurityScore } from "@/lib/security-score";

export const dynamic = "force-dynamic";

export default async function ServerOverview({
  params,
}: {
  params: { id: string };
}) {
  const { server } = await getOwnedServer(params.id);
  const overview = await getUserOverview([server.id]);

  const [connections, recentActions] = await Promise.all([
    db.player.count({ where: { serverId: server.id } }),
    db.punishAction.findMany({
      where: { serverId: server.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const features = parseJson<string[]>(server.licenseKey?.features ?? "[]", []);

  const config = parseJson<{ rules?: Record<string, boolean>; actions?: Record<string, string> }>(
    server.config,
    {}
  );
  const security = computeSecurityScore({
    rules: sanitizeRules(config.rules),
    actions: sanitizeActions(config.actions),
    online: server.status === "ONLINE",
    acVersion: server.acVersion,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={server.name}
        description={`${server.ip ?? "IP ayarlanmadı"} · AC ${server.acVersion ?? "—"} · Lisans: ${relativeDays(server.licenseKey?.expiresAt)}`}
        actions={
          <>
            <StatusBadge status={server.status} />
            <LinkButton href={`/dashboard/servers/${server.id}/settings`} variant="secondary" icon="download">
              İndir
            </LinkButton>
          </>
        }
      />

      {/* Bağlantı bilgisi */}
      {!server.lastSeenAt && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <Icons.bolt size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <div className="text-sm">
            <p className="font-medium text-amber-200">Sunucu henüz bağlanmadı</p>
            <p className="text-amber-200/70">
              FiveM kaynağını kurup API token&apos;ını girdiğinde bu sunucu otomatik
              olarak çevrimiçi olacak. Token için{" "}
              <a href={`/dashboard/servers/${server.id}/settings`} className="underline">
                Yapılandırma
              </a>{" "}
              sekmesine bak.
            </p>
          </div>
        </div>
      )}

      {/* Güvenlik Skoru */}
      <SecurityScoreCard server={server} security={security} />

      {/* Stat kartları */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bağlantılar" value={connections.toLocaleString("tr-TR")} icon="activity" accent="brand" />
        <StatCard label="Toplam Oyuncu" value={overview.totalPlayers.toLocaleString("tr-TR")} icon="users" accent="violet" />
        <StatCard label="Toplam Ban" value={overview.totalBans} icon="ban" accent="rose" sub={`${overview.activeBans} aktif`} />
        <StatCard label="Şu An Online" value={`${overview.onlinePlayers}/${server.maxSlots}`} icon="server" accent="emerald" />
      </div>

      {/* Grafik + donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Sunucu Analitiği</h3>
              <p className="text-xs text-slate-500">Son 24 saat</p>
            </div>
            <Badge tone="blue" dot>Canlı</Badge>
          </div>
          <AreaTrend data={overview.series} />
        </Card>

        <Card>
          <h3 className="mb-1 text-sm font-semibold text-white">Tespitler</h3>
          <p className="mb-3 text-xs text-slate-500">Son 24 saat</p>
          {overview.detectionsByType.length ? (
            <DonutChart data={overview.detectionsByType} centerValue={overview.detections24h} centerLabel="tespit" />
          ) : (
            <div className="grid h-[200px] place-items-center text-sm text-slate-500">Tespit yok 🎉</div>
          )}
        </Card>
      </div>

      {/* Cezalar + lisans özellikleri + son aksiyonlar */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Cezalar (24s)</h3>
          <div className="space-y-3">
            <PunishRow label="Uyarı" value={overview.actions.WARN} tone="amber" icon="warn" />
            <PunishRow label="Kick" value={overview.actions.KICK} tone="blue" icon="kick" />
            <PunishRow label="Ban" value={overview.actions.BAN} tone="rose" icon="ban" />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Aktif Korumalar</h3>
          {features.length ? (
            <div className="flex flex-wrap gap-1.5">
              {features.map((f) => (
                <span key={f} className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
                  {featureLabel(f)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Lisansta özellik tanımlı değil.</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Son İşlemler</h3>
          {recentActions.length ? (
            <ul className="space-y-3">
              {recentActions.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-300">
                    <Icons.bolt size={13} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">
                      {a.type} · {a.playerName}
                    </p>
                    <p className="text-xs text-slate-500">{timeAgo(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">İşlem yok</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function SecurityScoreCard({
  server,
  security,
}: {
  server: { id: string };
  security: ReturnType<typeof computeSecurityScore>;
}) {
  const gradeMeta: Record<
    ReturnType<typeof computeSecurityScore>["grade"],
    { label: string; ring: string; text: string; bar: string }
  > = {
    excellent: { label: "Mükemmel", ring: "ring-emerald-500/30", text: "text-emerald-300", bar: "bg-emerald-400" },
    good: { label: "İyi", ring: "ring-brand-500/30", text: "text-brand-300", bar: "bg-brand-400" },
    fair: { label: "Orta", ring: "ring-amber-500/30", text: "text-amber-300", bar: "bg-amber-400" },
    weak: { label: "Zayıf", ring: "ring-orange-500/30", text: "text-orange-300", bar: "bg-orange-400" },
    critical: { label: "Kritik", ring: "ring-rose-500/30", text: "text-rose-300", bar: "bg-rose-400" },
  };
  const meta = gradeMeta[security.grade];

  return (
    <Card className={`ring-1 ring-inset ${meta.ring}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-4">
          <div className="relative grid h-20 w-20 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(security.score / 100) * 97.4} 97.4`}
                className={meta.text}
              />
            </svg>
            <span className="absolute text-xl font-bold text-white">{security.score}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Güvenlik Skoru</p>
            <p className={`text-lg font-semibold ${meta.text}`}>{meta.label}</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          {security.breakdown.map((b) => (
            <div key={b.label} className="min-w-0">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate text-slate-400">{b.label}</span>
                <span className="text-slate-500">{b.score}/{b.max}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${(b.score / b.max) * 100}%` }} />
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-600" title={b.hint}>{b.hint}</p>
            </div>
          ))}
        </div>

        {security.score < 70 && (
          <LinkButton href={`/dashboard/servers/${server.id}/rules`} variant="secondary" icon="shieldCheck" className="shrink-0">
            İyileştir
          </LinkButton>
        )}
      </div>
    </Card>
  );
}

function PunishRow({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "rose";
  icon: "warn" | "kick" | "ban";
}) {
  const Icon = Icons[icon];
  const color =
    tone === "amber" ? "text-amber-300 bg-amber-500/10" : tone === "blue" ? "text-brand-300 bg-brand-500/10" : "text-rose-300 bg-rose-500/10";
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2.5 text-sm text-slate-300">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}>
          <Icon size={15} />
        </span>
        {label}
      </span>
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
  );
}
