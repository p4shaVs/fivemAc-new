import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KicksPage({ params }: { params: { id: string } }) {
  const { server } = await getOwnedServer(params.id);
  const kicks = await db.punishAction.findMany({
    where: { serverId: server.id, type: "KICK" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Kickler" description="Oyunculara uygulanan kickler." />
      {kicks.length === 0 ? (
        <EmptyState icon="kick" title="Kick kaydı yok" description="Oyunculara uygulanan kickler burada listelenir." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-base-850/60">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Oyuncu</th>
                <th className="px-4 py-3 font-medium">Sebep</th>
                <th className="px-4 py-3 font-medium">Veren</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {kicks.map((k) => (
                <tr key={k.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-slate-200">{k.playerName}</td>
                  <td className="px-4 py-3 text-slate-300">{k.reason}</td>
                  <td className="px-4 py-3 text-slate-400">{k.issuedBy}</td>
                  <td className="px-4 py-3">
                    <Badge tone={k.status === "DELIVERED" ? "green" : "amber"}>
                      {k.status === "DELIVERED" ? "İletildi" : "Bekliyor"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(k.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
