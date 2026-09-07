import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { ResourcesManager, type ResourceRow } from "./resources-manager";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({ params }: { params: { id: string } }) {
  const { server } = await getOwnedServer(params.id);
  const resources = await db.serverResource.findMany({
    where: { serverId: server.id },
    orderBy: { name: "asc" },
  });

  const rows: ResourceRow[] = resources.map((r) => ({ id: r.id, name: r.name, state: r.state }));

  return (
    <>
      <PageHeader
        title="Kaynaklar"
        description="Sunucudaki FiveM kaynaklarını görüntüle, başlat/durdur/yeniden başlat."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="cube"
          title="Kaynak bulunamadı"
          description="Sunucu bağlanıp kaynak listesini gönderince burada görünecek. (Yerelde resource'u kurup sunucuyu başlat.)"
        />
      ) : (
        <ResourcesManager serverId={server.id} resources={rows} />
      )}
    </>
  );
}
