"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Icons } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export interface AdminRow {
  id: string;
  identifier: string;
  displayName: string | null;
  role: string;
  permissions: string[];
  createdAt: string;
}

const PERMS: { key: string; label: string }[] = [
  { key: "kick", label: "Kick" },
  { key: "ban", label: "Ban" },
  { key: "warn", label: "Uyar" },
  { key: "spectate", label: "İzle" },
  { key: "revive", label: "Canlandır" },
  { key: "tp", label: "Işınlan" },
  { key: "bring", label: "Getir" },
  { key: "freeze", label: "Dondur" },
  { key: "announce", label: "Duyuru" },
  { key: "screenshot", label: "Ekran" },
];

const roleTone: Record<string, "violet" | "blue" | "gray"> = {
  OWNER: "violet",
  ADMIN: "blue",
  MODERATOR: "gray",
};
const roleLabel: Record<string, string> = {
  OWNER: "Sahip",
  ADMIN: "Yönetici",
  MODERATOR: "Moderatör",
};

export function AdminsManager({
  serverId,
  admins,
}: {
  serverId: string;
  admins: AdminRow[];
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("MODERATOR");
  const [perms, setPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePerm(k: string) {
    setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${serverId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          displayName: displayName || undefined,
          role,
          permissions: perms.length ? perms : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Eklenemedi");
      setIdentifier("");
      setDisplayName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu yetkiliyi kaldır?")) return;
    const res = await fetch(`/api/servers/${serverId}/admins/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {admins.length === 0 ? (
          <EmptyState
            icon="user"
            title="Henüz yetkili yok"
            description="Oyun içi yetkilere sahip olacak kişileri identifier ile ekle."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-base-850/60">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Yetkili</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Eklenme</th>
                  <th className="px-4 py-3 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200">{a.displayName ?? "—"}</p>
                      <code className="font-mono text-[11px] text-slate-500">{a.identifier}</code>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={roleTone[a.role] ?? "gray"}>{roleLabel[a.role] ?? a.role}</Badge>
                      {a.permissions.length > 0 && (
                        <p className="mt-1 text-[10px] text-slate-500">{a.permissions.length} izin</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(a.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                      >
                        <Icons.trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Card>
        <h3 className="mb-1 text-sm font-semibold text-white">Yetkili Ekle</h3>
        <p className="mb-4 text-xs text-slate-500">
          license:, steam: veya discord: tanımlayıcısı girin.
        </p>
        <form onSubmit={add} className="space-y-3">
          <div>
            <label className="label">Tanımlayıcı (identifier)</label>
            <input
              className="input font-mono text-xs"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="discord:123456789012345678"
              required
            />
          </div>
          <div>
            <label className="label">Görünen Ad (opsiyonel)</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ahmet" />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="MODERATOR">Moderatör</option>
              <option value="ADMIN">Yönetici</option>
              <option value="OWNER">Sahip</option>
            </select>
          </div>
          <div>
            <label className="label">Oyun içi izinler (boşsa role göre atanır)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PERMS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePerm(p.key)}
                  className={
                    "rounded-lg border px-2 py-1.5 text-[11px] font-medium transition " +
                    (perms.includes(p.key)
                      ? "border-brand-500/50 bg-brand-500/10 text-white"
                      : "border-white/10 text-slate-400 hover:bg-white/5")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Ekleniyor…" : "Yetkili Ekle"}
          </button>
        </form>
      </Card>
    </div>
  );
}
