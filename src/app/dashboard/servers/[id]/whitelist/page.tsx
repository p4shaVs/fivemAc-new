import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { BypassManager, type BypassRow } from "./bypass-manager";

export const dynamic = "force-dynamic";

export default async function WhitelistPage({ params }: { params: { id: string } }) {
  const { server } = await getOwnedServer(params.id);
  const rows = await db.whitelist.findMany({
    where: { serverId: server.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const list: BypassRow[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    value: r.value,
    note: r.note,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Bypass (Muafiyet)"
        description="Bu kimliklere sahip oyuncular otomatik ban ve korumalardan muaf tutulur. Yöneticiler ve içerik üreticiler için idealdir."
      />
      <BypassManager serverId={server.id} rows={list} />
    </>
  );
}
