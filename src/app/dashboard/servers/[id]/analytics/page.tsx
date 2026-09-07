import { getOwnedServer } from "@/lib/guards";
import { getUserOverview } from "@/lib/stats";
import { PageHeader, StatCard, Card, Badge } from "@/components/ui";
import { AreaTrend, DonutChart } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ params }: { params: { id: string } }) {
  const { server } = await getOwnedServer(params.id);
  const o = await getUserOverview([server.id]);

  return (
    <>
      <PageHeader title="Analitik" description="Sunucunun son 24 saatteki metrikleri." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Oyuncu" value={o.totalPlayers.toLocaleString("tr-TR")} icon="users" accent="brand" />
        <StatCard label="Şu An Online" value={o.onlinePlayers} icon="activity" accent="emerald" />
        <StatCard label="Aktif Ban" value={o.activeBans} icon="ban" accent="rose" />
        <StatCard label="Tespit (24s)" value={o.detections24h} icon="shield" accent="violet" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Aktivite (24s)</h3>
            <Badge tone="blue" dot>Canlı</Badge>
          </div>
          <AreaTrend data={o.series} />
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-white">Tespit Dağılımı</h3>
          {o.detectionsByType.length ? (
            <DonutChart data={o.detectionsByType} centerValue={o.detections24h} centerLabel="tespit" />
          ) : (
            <div className="grid h-[200px] place-items-center text-sm text-slate-500">Tespit yok 🎉</div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Uyarı", o.actions.WARN, "amber"], ["Kick", o.actions.KICK, "blue"], ["Ban", o.actions.BAN, "rose"]].map(([l, v]) => (
          <Card key={l as string}>
            <p className="text-xs uppercase tracking-wide text-slate-500">{l as string} (24s)</p>
            <p className="mt-1 text-3xl font-bold text-white">{v as number}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
