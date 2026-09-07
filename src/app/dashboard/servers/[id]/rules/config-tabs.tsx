"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { RulesEditor } from "./rules-editor";
import { ActionsEditor } from "./actions-editor";
import type { DetectionAction } from "@/lib/detection-actions";

// Yapılandırma sayfası: Güvenlik Kuralları (hangi tespitler açık) ve
// Aksiyonlar (her tespit için log/kick/ban) iki ayrı sekmede.
export function ConfigTabs({
  serverId,
  initialRules,
  initialActions,
}: {
  serverId: string;
  initialRules: Record<string, boolean>;
  initialActions: Record<string, DetectionAction>;
}) {
  const [tab, setTab] = useState<"rules" | "actions">("rules");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-base-900/60 p-1">
        <button
          onClick={() => setTab("rules")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
            tab === "rules" ? "bg-brand-500/15 text-white ring-1 ring-inset ring-brand-500/40" : "text-slate-400 hover:bg-white/5"
          )}
        >
          <Icons.shieldCheck size={16} /> Güvenlik Kuralları
        </button>
        <button
          onClick={() => setTab("actions")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
            tab === "actions" ? "bg-brand-500/15 text-white ring-1 ring-inset ring-brand-500/40" : "text-slate-400 hover:bg-white/5"
          )}
        >
          <Icons.bolt size={16} /> Aksiyonlar
        </button>
      </div>

      {tab === "rules" ? (
        <RulesEditor serverId={serverId} initialRules={initialRules} />
      ) : (
        <ActionsEditor serverId={serverId} initialActions={initialActions} />
      )}
    </div>
  );
}
