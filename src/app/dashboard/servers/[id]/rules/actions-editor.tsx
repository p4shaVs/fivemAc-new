"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import {
  DETECTION_TYPES,
  DETECTION_CATEGORIES,
  defaultActions,
  type DetectionAction,
} from "@/lib/detection-actions";
import { cn } from "@/lib/utils";

const ACTION_META: Record<DetectionAction, { label: string; tone: string }> = {
  LOG: { label: "Log", tone: "text-slate-300 border-white/10" },
  KICK: { label: "Kick", tone: "text-amber-300 border-amber-500/30 bg-amber-500/10" },
  BAN: { label: "Ban", tone: "text-rose-300 border-rose-500/30 bg-rose-500/10" },
};

export function ActionsEditor({
  serverId,
  initialActions,
}: {
  serverId: string;
  initialActions: Record<string, DetectionAction>;
}) {
  const router = useRouter();
  const [actions, setActions] = useState(initialActions);
  const [tab, setTab] = useState<(typeof DETECTION_CATEGORIES)[number]["id"]>(DETECTION_CATEGORIES[0].id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(actions) !== JSON.stringify(initialActions),
    [actions, initialActions]
  );

  function setFor(type: string, action: DetectionAction) {
    setActions((a) => ({ ...a, [type]: action }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  const items = DETECTION_TYPES.filter((d) => d.category === tab);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/5 bg-base-850/60 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
            <Icons.bolt size={20} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">Tespit Aksiyonları</h3>
            <p className="text-xs text-slate-500">
              Her hile türü için ne yapılacağını seçin — sadece kaydet (Log), oyundan at (Kick) ya da yasakla (Ban).
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DETECTION_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setTab(c.id)}
            className={cn(
              "shrink-0 rounded-xl border px-3.5 py-2 text-sm font-medium transition",
              tab === c.id
                ? "border-brand-500/50 bg-brand-500/10 text-white"
                : "border-white/10 text-slate-400 hover:bg-white/5"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((d) => {
          const current = actions[d.type] ?? d.defaultAction;
          return (
            <div
              key={d.type}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-base-850/60 px-4 py-3"
            >
              <p className="text-sm font-medium text-slate-200">{d.label}</p>
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-base-900/60 p-1">
                {(["LOG", "KICK", "BAN"] as DetectionAction[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setFor(d.type, a)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-semibold transition",
                      current === a ? ACTION_META[a].tone : "border-transparent text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {ACTION_META[a].label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-card backdrop-blur-xl transition-all",
          dirty
            ? "border-brand-500/30 bg-base-850/90 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        <span className="text-sm text-slate-300">
          {saved ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Icons.check size={16} /> Kaydedildi
            </span>
          ) : (
            "Kaydedilmemiş değişiklikler var"
          )}
        </span>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setActions(initialActions)}>
            Geri Al
          </button>
          <button className="btn-ghost text-xs" onClick={() => setActions(defaultActions())}>
            Varsayılana Sıfırla
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
