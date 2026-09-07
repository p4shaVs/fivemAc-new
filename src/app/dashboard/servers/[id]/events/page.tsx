import { getOwnedServer } from "@/lib/guards";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { Icons } from "@/components/icons";
import { timeAgo } from "@/lib/utils";
import { detectionTypeLabel } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function EventsPage({ params }: { params: { id: string } }) {
  const { server } = await getOwnedServer(params.id);

  const [detections, actions] = await Promise.all([
    db.detection.findMany({ where: { serverId: server.id }, orderBy: { createdAt: "desc" }, take: 60 }),
    db.punishAction.findMany({ where: { serverId: server.id }, orderBy: { createdAt: "desc" }, take: 60 }),
  ]);

  type Ev = { id: string; kind: "detection" | "action"; label: string; sub: string; at: Date; tone: "rose" | "amber" | "blue" };
  const events: Ev[] = [
    ...detections.map((d) => ({
      id: "d" + d.id,
      kind: "detection" as const,
      label: `${detectionTypeLabel(d.type)} tespit edildi`,
      sub: `${d.playerName} · ${d.severity}`,
      at: d.createdAt,
      tone: "rose" as const,
    })),
    ...actions.map((a) => ({
      id: "a" + a.id,
      kind: "action" as const,
      label: `${a.type} — ${a.playerName}`,
      sub: `${a.reason} · ${a.issuedBy}`,
      at: a.createdAt,
      tone: a.type === "BAN" ? ("rose" as const) : ("amber" as const),
    })),
  ].sort((x, y) => y.at.getTime() - x.at.getTime()).slice(0, 100);

  return (
    <>
      <PageHeader title="Olaylar" description="Tespitler ve moderasyon olaylarının canlı akışı." />
      {events.length === 0 ? (
        <EmptyState icon="activity" title="Olay yok" description="Tespit ve moderasyon olayları burada akar." />
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-base-850/60 px-4 py-3">
              <span
                className={
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg " +
                  (e.tone === "rose" ? "bg-rose-500/10 text-rose-300" : e.tone === "amber" ? "bg-amber-500/10 text-amber-300" : "bg-brand-500/10 text-brand-300")
                }
              >
                <Icons.warn size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{e.label}</p>
                <p className="truncate text-xs text-slate-500">{e.sub}</p>
              </div>
              <Badge tone={e.kind === "detection" ? "violet" : "gray"}>{e.kind === "detection" ? "Tespit" : "İşlem"}</Badge>
              <span className="shrink-0 text-xs text-slate-500">{timeAgo(e.at)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
