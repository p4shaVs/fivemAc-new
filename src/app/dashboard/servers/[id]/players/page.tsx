import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui";
import { PlayersTable, type PlayerRow } from "./players-table";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  params,
}: {
  params: { id: string };
}) {
  const { server } = await getOwnedServer(params.id);

  const players = await db.player.findMany({
    where: { serverId: server.id },
    orderBy: [{ online: "desc" }, { lastSeenAt: "desc" }],
    take: 200,
  });

  const rows: PlayerRow[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    online: p.online,
    license: p.license,
    steam: p.steam,
    discord: p.discord,
    ip: p.ip,
    trustScore: p.trustScore,
    lastSeenAt: p.lastSeenAt.toISOString(),
  }));

  if (players.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="Henüz oyuncu kaydı yok"
        description="Sunucun bağlandığında ve oyuncular katıldığında burada listelenecek."
      />
    );
  }

  return <PlayersTable serverId={server.id} players={rows} />;
}
