import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WarnsPage({ params }: { params: { id: string } }) {
  const { server } = await getOwnedServer(params.id);
  const warns = await db.punishAction.findMany({
    where: { serverId: server.id, type: "WARN" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Uyarılar" description="Oyunculara verilen uyarılar." />
      {warns.length === 0 ? (
        <EmptyState icon="warn" title="Uyarı kaydı yok" description="Oyunculara verilen uyarılar burada listelenir." />
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
              {warns.map((w) => (
                <tr key={w.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-slate-200">{w.playerName}</td>
                  <td className="px-4 py-3 text-slate-300">{w.reason}</td>
                  <td className="px-4 py-3 text-slate-400">{w.issuedBy}</td>
                  <td className="px-4 py-3">
                    <Badge tone={w.status === "DELIVERED" ? "green" : "amber"}>
                      {w.status === "DELIVERED" ? "İletildi" : "Bekliyor"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(w.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
