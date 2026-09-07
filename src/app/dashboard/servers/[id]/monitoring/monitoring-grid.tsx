"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface MonPlayer {
  id: string;
  name: string;
  trustScore: number;
  health: number | null;
  armor: number | null;
  activity: string | null;
}

export function MonitoringGrid({ serverId, players }: { serverId: string; players: MonPlayer[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {players.map((p) => (
        <Tile key={p.id} serverId={serverId} p={p} />
      ))}
    </div>
  );
}

function Tile({ serverId, p }: { serverId: string; p: MonPlayer }) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const liveRef = useRef(false);

  // Tek kare al (izin istemeden).
  async function captureOnce(): Promise<boolean> {
    await fetch(`/api/servers/${serverId}/screenshot`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: p.id }),
    });
    for (let i = 0; i < 16; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      const res = await fetch(`/api/servers/${serverId}/screenshot?playerId=${p.id}`);
      const json = await res.json();
      if (json.ok && json.data.status === "DONE" && json.data.url) { setUrl(json.data.url + "?t=" + Date.now()); return true; }
      if (json.ok && json.data.status === "FAILED") { setStatus("Alınamadı"); return false; }
    }
    setStatus("Zaman aşımı");
    return false;
  }

  async function capture() {
    setBusy(true); setStatus("İsteniyor…");
    try { await captureOnce(); setStatus(""); } finally { setBusy(false); }
  }

  // Canlı akış: sürekli yeni kare iste (izin istemeden, tek tık).
  useEffect(() => {
    liveRef.current = live;
    if (!live) return;
    let stop = false;
    (async () => {
      while (!stop && liveRef.current) {
        setBusy(true);
        const okShot = await captureOnce();
        setBusy(false);
        if (!okShot) { setLive(false); break; }
        await new Promise((r) => setTimeout(r, 1500));
      }
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const tone = p.trustScore >= 70 ? "green" : p.trustScore >= 40 ? "amber" : "red";

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-base-850/60", live ? "border-brand-500/40" : "border-white/5")}>
      <button onClick={capture} disabled={busy && !live} className="relative block aspect-video w-full bg-gradient-to-br from-slate-700/30 to-base-950">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-grid-faint [background-size:14px_14px] opacity-30" />
            <div className="absolute inset-0 grid place-items-center text-slate-500">
              {busy ? <span className="animate-pulse text-[11px]">{status || "…"}</span> : (
                <span className="flex flex-col items-center gap-1 text-slate-600">
                  <Icons.eye size={20} /><span className="text-[10px]">{status || "Ekranı iste"}</span>
                </span>
              )}
            </div>
          </>
        )}
        {live && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> CANLI
          </span>
        )}
        {p.health != null && (
          <span className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-black/50">
              <span className="block h-full rounded-full bg-rose-400" style={{ width: `${Math.min(100, Math.max(0, p.health - 100))}%` }} />
            </span>
            {p.armor != null && (
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-black/50">
                <span className="block h-full rounded-full bg-brand-400" style={{ width: `${Math.min(100, p.armor)}%` }} />
              </span>
            )}
          </span>
        )}
      </button>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="truncate text-xs text-slate-300">{p.name}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setLive((l) => !l)} title="Canlı izle"
            className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium transition", live ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-slate-400 hover:bg-white/10")}>
            {live ? "Durdur" : "Canlı"}
          </button>
          <Badge tone={tone as "green" | "amber" | "red"}>{100 - p.trustScore}</Badge>
        </div>
      </div>
    </div>
  );
}
