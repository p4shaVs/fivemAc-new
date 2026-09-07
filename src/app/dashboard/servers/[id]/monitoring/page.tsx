import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { MonitoringGrid, type MonPlayer } from "./monitoring-grid";

export const dynamic = "force-dynamic";

export default async function MonitoringPage({ params }: { params: { id: string } }) {
  const { server } = await getOwnedServer(params.id);
  const players = await db.player.findMany({
    where: { serverId: server.id, online: true },
    orderBy: { trustScore: "asc" },
    take: 60,
  });

  const rows: MonPlayer[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    trustScore: p.trustScore,
    health: p.health,
    armor: p.armor,
    activity: p.activity,
  }));

  return (
    <>
      <PageHeader
        title="İzleme"
        description="Çevrimiçi oyuncuların canlı ekran görüntülerini talep edin. Sunucuda screenshot-basic kaynağı kurulu olmalıdır."
      />
      {rows.length === 0 ? (
        <EmptyState icon="eye" title="Çevrimiçi oyuncu yok" description="Oyuncular bağlandığında burada listelenir." />
      ) : (
        <MonitoringGrid serverId={server.id} players={rows} />
      )}
    </>
  );
}
