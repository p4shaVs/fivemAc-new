"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Badge } from "@/components/ui";
import { Icons } from "@/components/icons";
import { timeAgo, cn } from "@/lib/utils";

export interface PlayerRow {
  id: string;
  name: string;
  online: boolean;
  license: string | null;
  steam: string | null;
  discord: string | null;
  ip: string | null;
  trustScore: number;
  lastSeenAt: string;
}

type ActionType = "WARN" | "KICK" | "BAN";

export function PlayersTable({
  serverId,
  players,
}: {
  serverId: string;
  players: PlayerRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [target, setTarget] = useState<PlayerRow | null>(null);
  const [action, setAction] = useState<ActionType>("KICK");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return players.filter((p) => {
      if (onlyOnline && !p.online) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.license ?? "").toLowerCase().includes(q) ||
        (p.discord ?? "").toLowerCase().includes(q)
      );
    });
  }, [players, query, onlyOnline]);

  function openAction(p: PlayerRow, a: ActionType) {
    setTarget(p);
    setAction(a);
    setReason("");
    setDuration("");
    setError(null);
  }

  async function submit() {
    if (!target) return;
    if (reason.trim().length < 2) {
      setError("Lütfen bir sebep girin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${serverId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: target.id,
          type: action,
          reason: reason.trim(),
          durationHours:
            action === "BAN" && duration ? Number(duration) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "İşlem başarısız");
      setTarget(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  }

  const actionLabel = { WARN: "Uyar", KICK: "Kickle", BAN: "Banla" }[action];

  return (
    <div className="space-y-4">
      {/* Araç çubuğu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Icons.search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="İsim, lisans veya Discord ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={onlyOnline}
            onChange={(e) => setOnlyOnline(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-base-900"
          />
          Sadece çevrimiçi
        </label>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-base-850/60">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Oyuncu</th>
              <th className="px-4 py-3 font-medium">License</th>
              <th className="px-4 py-3 font-medium">Discord</th>
              <th className="px-4 py-3 font-medium">Güven</th>
              <th className="px-4 py-3 font-medium">Son görülme</th>
              <th className="px-4 py-3 text-right font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        p.online ? "bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" : "bg-slate-600"
                      )}
                    />
                    <span className="font-medium text-slate-200">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-500" title={p.license ?? ""}>
                    {p.license ? p.license.replace("license:", "").slice(0, 14) + "…" : "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-500">
                    {p.discord ? p.discord.replace("discord:", "") : "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <TrustBadge score={p.trustScore} />
                </td>
                <td className="px-4 py-3 text-slate-500">{timeAgo(p.lastSeenAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <ActionBtn icon="warn" title="Uyar" onClick={() => openAction(p, "WARN")} />
                    <ActionBtn icon="kick" title="Kick" onClick={() => openAction(p, "KICK")} />
                    <ActionBtn icon="ban" title="Ban" danger onClick={() => openAction(p, "BAN")} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Eşleşen oyuncu yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ceza modalı */}
      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={`${target?.name ?? ""} — ${actionLabel}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setTarget(null)}>
              Vazgeç
            </button>
            <button
              className={action === "BAN" ? "btn-danger" : "btn-primary"}
              onClick={submit}
              disabled={loading}
            >
              {loading ? "…" : actionLabel}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["WARN", "KICK", "BAN"] as ActionType[]).map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
                  action === a
                    ? "border-brand-500/50 bg-brand-500/10 text-white"
                    : "border-white/10 text-slate-400 hover:bg-white/5"
                )}
              >
                {{ WARN: "Uyar", KICK: "Kick", BAN: "Ban" }[a]}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Sebep</label>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Örn. Aimbot kullanımı"
              autoFocus
            />
          </div>
          {action === "BAN" && (
            <div>
              <label className="label">Süre (saat) — boş bırakılırsa kalıcı</label>
              <input
                className="input"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Kalıcı"
              />
            </div>
          )}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <p className="text-xs text-slate-500">
            İşlem kuyruğa alınır ve sunucu bağlıyken anında uygulanır.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function ActionBtn({
  icon,
  title,
  onClick,
  danger,
}: {
  icon: "warn" | "kick" | "ban";
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const Icon = Icons[icon];
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10",
        danger ? "hover:border-rose-500/40 hover:text-rose-300" : "hover:text-slate-100"
      )}
    >
      <Icon size={15} />
    </button>
  );
}

function TrustBadge({ score }: { score: number }) {
  const tone = score >= 70 ? "green" : score >= 40 ? "amber" : "red";
  return (
    <Badge tone={tone as any}>
      {score}
    </Badge>
  );
}
