import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Sunucular" };
export const dynamic = "force-dynamic";

export default async function AdminServersPage() {
  const servers = await db.server.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      owner: { select: { username: true, email: true } },
      _count: { select: { players: true, bans: true } },
    },
  });

  return (
    <>
      <PageHeader title="Sunucular" description="Platformdaki tüm korunan sunucular." />
      {servers.length === 0 ? (
        <EmptyState icon="server" title="Sunucu yok" description="Henüz hiç sunucu oluşturulmadı." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-base-850/60">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Sunucu</th>
                <th className="px-4 py-3 font-medium">Sahip</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Oyuncu</th>
                <th className="px-4 py-3 font-medium">Ban</th>
                <th className="px-4 py-3 font-medium">Son görülme</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.ip ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-300">{s.owner.username}</p>
                    <p className="text-xs text-slate-500">{s.owner.email}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{s._count.players}</td>
                  <td className="px-4 py-3 text-slate-400">{s._count.bans}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.lastSeenAt ? timeAgo(s.lastSeenAt) : "Hiç"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
