import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui";
import { BansManager, type BanRow } from "./bans-manager";

export const dynamic = "force-dynamic";

export default async function BansPage({
  params,
}: {
  params: { id: string };
}) {
  const { server } = await getOwnedServer(params.id);
  const bans = await db.ban.findMany({
    where: { serverId: server.id },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  if (bans.length === 0) {
    return (
      <EmptyState
        icon="ban"
        title="Ban kaydı yok"
        description="Oyuncular sayfasından veya otomatik tespitlerle verilen banlar burada görünür."
      />
    );
  }

  const rows: BanRow[] = bans.map((b) => ({
    id: b.id,
    code: b.code,
    playerName: b.playerName,
    license: b.license,
    discord: b.discord,
    steam: b.steam,
    ip: b.ip,
    reason: b.reason,
    bannedBy: b.bannedBy,
    createdAt: b.createdAt.toISOString(),
    expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
    active: b.active,
    permanent: b.permanent,
    detectionId: b.detectionId,
  }));

  return <BansManager serverId={server.id} bans={rows} />;
}
