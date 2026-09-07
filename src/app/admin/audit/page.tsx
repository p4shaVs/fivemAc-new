import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { formatDateTime, parseJson } from "@/lib/utils";

export const metadata: Metadata = { title: "Denetim Kaydı" };
export const dynamic = "force-dynamic";

const toneFor = (action: string) => {
  if (action.includes("FAIL")) return "red" as const;
  if (action.startsWith("KEY") || action.startsWith("PRODUCT")) return "violet" as const;
  if (action.startsWith("MODERATE") || action.includes("BAN")) return "amber" as const;
  if (action === "LOGIN" || action === "REGISTER") return "green" as const;
  return "gray" as const;
};

export default async function AuditPage() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { username: true } } },
  });

  return (
    <>
      <PageHeader
        title="Denetim Kaydı"
        description="Güvenlik açısından önemli tüm işlemlerin kaydı."
      />
      {logs.length === 0 ? (
        <EmptyState icon="logs" title="Kayıt yok" description="Henüz denetim kaydı oluşmadı." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-base-850/60">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Zaman</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
                <th className="px-4 py-3 font-medium">Kullanıcı</th>
                <th className="px-4 py-3 font-medium">Hedef</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const meta = parseJson<Record<string, unknown>>(l.meta, {});
                return (
                  <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3"><Badge tone={toneFor(l.action)}>{l.action}</Badge></td>
                    <td className="px-4 py-3 text-slate-300">{l.user?.username ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {l.targetType ? `${l.targetType}` : Object.keys(meta).length ? JSON.stringify(meta).slice(0, 40) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.ip ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
