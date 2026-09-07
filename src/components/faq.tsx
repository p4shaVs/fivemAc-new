"use client";

import { useState } from "react";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    q: "Kurulum süreci nasıl işliyor?",
    a: "Lisansını etkinleştirip kaynağı (resource) sunucuna ekliyorsun, config'e API adresi ve token'ını giriyorsun. Sunucuyu başlatınca panelde çevrimiçi görünüyor — ortalama 5 dakika.",
  },
  {
    q: "Core Shield Anti-Cheat sunucu performansımı etkiler mi?",
    a: "Hayır. Optimize edilmiş sunucu taraflı yapı ile 5ms altı işlem süresi hedeflenir; sunucuna minimum yük bindirir.",
  },
  {
    q: "Core Shield hangi tür hileleri tespit edebilir?",
    a: "Aimbot, silent aim, overlay/ESP, godmode, spoofer, illegal weapon/vehicle/object spawn, resource injection, event exploit ve daha fazlası — hem imza hem davranış tabanlı.",
  },
  {
    q: "Müşteri desteği sunuyor musunuz?",
    a: "Evet, 7/24 Discord desteği. Kurulum ve yapılandırmada ekibimiz yanında.",
  },
  {
    q: "Deneme sürümü var mı?",
    a: "Evet. Canlı Demo bölümünden demo hesabıyla tüm paneli kaydolmadan inceleyebilirsin.",
  },
  {
    q: "Anti-cheat'i ne sıklıkla güncelliyorsunuz?",
    a: "Yeni hile ve exploit'lere karşı düzenli güncellemeler yayınlarız; kritik durumlarda anında yama geçeriz.",
  },
  {
    q: "Core Shield her FiveM framework'ü ile uyumlu mu?",
    a: "Evet. ESX, QBCore, QBox ve standalone dahil yaygın framework'lerle uyumlu çalışır.",
  },
  {
    q: "Web panelinden oyuncu banlayabilir miyim?",
    a: "Evet. Web panelinden banla, kickle, uyar; ban geçmişini ve alt hesapları sorgula. Komutlar sunucuya anında iletilir.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-2xl border transition",
              isOpen ? "border-brand-500/30 bg-base-850/70" : "border-white/5 bg-base-850/40"
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-white">{it.q}</span>
              <Icons.chevronDown
                size={18}
                className={cn("shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
