"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { Icons } from "@/components/icons";

interface Props {
  server: {
    id: string;
    name: string;
    ip: string | null;
    maxSlots: number;
    discordWebhook: string;
    webhookEvents: Record<string, boolean>;
    hasToken: boolean;
  };
  appUrl: string;
}

const WEBHOOK_EVENTS: { key: string; label: string }[] = [
  { key: "ban", label: "Yasaklama" },
  { key: "unban", label: "Yasak Kaldırma" },
  { key: "kick", label: "Kick" },
  { key: "warn", label: "Uyarı" },
  { key: "detection", label: "Hile Tespiti" },
  { key: "autoban", label: "Otomatik Ban" },
  { key: "blacklist", label: "Kara Liste İhlali" },
  { key: "connect", label: "Bağlanma" },
];

export function ServerSettings({ server, appUrl }: Props) {
  const router = useRouter();
  const [name, setName] = useState(server.name);
  const [ip, setIp] = useState(server.ip ?? "");
  const [maxSlots, setMaxSlots] = useState(String(server.maxSlots));
  const [webhook, setWebhook] = useState(server.discordWebhook);
  const [events, setEvents] = useState<Record<string, boolean>>(server.webhookEvents);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/servers/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ip: ip || null,
          maxSlots: Number(maxSlots) || 64,
          discordWebhook: webhook || null,
          webhookEvents: events,
        }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    if (!confirm("Yeni token oluşturulacak, eski token geçersiz olacak. Devam?")) return;
    setRegenLoading(true);
    try {
      const res = await fetch(`/api/servers/${server.id}/token`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.ok) setToken(json.data.apiToken);
    } finally {
      setRegenLoading(false);
    }
  }

  async function remove() {
    if (!confirm(`"${server.name}" sunucusu ve tüm verileri silinecek. Bu geri alınamaz!`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/servers/${server.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/servers");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Genel ayarlar */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Genel</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Sunucu Adı</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Sunucu IP</label>
              <input className="input" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="123.45.67.89" />
            </div>
            <div>
              <label className="label">Maksimum Slot</label>
              <input
                className="input"
                type="number"
                min={1}
                value={maxSlots}
                onChange={(e) => setMaxSlots(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Discord Webhook (opsiyonel)</label>
              <input
                className="input"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Ban, kick, tespit gibi olaylar bu webhook&apos;a embed olarak gönderilir.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {WEBHOOK_EVENTS.map((e) => {
                  const on = events[e.key] ?? false;
                  return (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => setEvents((prev) => ({ ...prev, [e.key]: !on }))}
                      className={
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition " +
                        (on
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 text-slate-500 hover:bg-white/5")
                      }
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <Icons.check size={16} /> Kaydedildi
              </span>
            )}
          </div>
        </Card>

        {/* Bağlantı / kurulum */}
        <Card>
          <h3 className="mb-1 text-sm font-semibold text-white">FiveM Bağlantısı</h3>
          <p className="mb-4 text-xs text-slate-500">
            Anti-cheat kaynağının server.cfg / config dosyasına aşağıdaki değerleri gir.
          </p>
          <div className="space-y-3">
            <div>
              <label className="label">API Adresi</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-white/10 bg-base-900/80 px-3 py-2 font-mono text-sm text-slate-200">
                  {appUrl || "https://panel.aeigs.gg"}/api/v1
                </code>
                <CopyButton value={`${appUrl || "https://panel.aeigs.gg"}/api/v1`} label="" className="h-9 w-9 justify-center px-0" />
              </div>
            </div>
            <div>
              <label className="label">Sunucu Token&apos;ı</label>
              {token ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 font-mono text-sm text-emerald-200">
                      {token}
                    </code>
                    <CopyButton value={token} label="" className="h-9 w-9 justify-center px-0" />
                  </div>
                  <p className="text-xs text-amber-300">
                    ⚠ Bu token yalnızca bir kez gösterilir. Güvenli bir yere kaydet!
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-base-900/60 px-3 py-2.5">
                  <span className="text-sm text-slate-500">
                    {server.hasToken ? "Token gizli (güvenlik). Gerekirse yenile." : "Henüz token yok."}
                  </span>
                  <button onClick={regenerate} disabled={regenLoading} className="btn-secondary text-xs">
                    <Icons.key size={14} />
                    {regenLoading ? "…" : "Token Yenile"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Tehlikeli bölge */}
      <div>
        <Card className="border-rose-500/20">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-300">
            <Icons.trash size={16} /> Tehlikeli Bölge
          </h3>
          <p className="mb-4 text-sm text-slate-400">
            Sunucuyu silmek tüm oyuncu, ban ve log kayıtlarını kalıcı olarak siler.
          </p>
          <button onClick={remove} disabled={deleting} className="btn-danger w-full">
            {deleting ? "Siliniyor…" : "Sunucuyu Sil"}
          </button>
        </Card>
      </div>
    </div>
  );
}
