import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Dokümantasyon" };

const endpoints = [
  { method: "POST", path: "/api/v1/heartbeat", desc: "Sunucu durumu ve slot bilgisini gönderir (çevrimiçi tutar)." },
  { method: "POST", path: "/api/v1/players/sync", desc: "Aktif oyuncu listesini senkronize eder." },
  { method: "POST", path: "/api/v1/detections", desc: "Bir tespit (aimbot, vb.) raporlar." },
  { method: "GET", path: "/api/v1/actions/pending", desc: "Panelden verilen bekleyen cezaları çeker." },
  { method: "POST", path: "/api/v1/actions/ack", desc: "Uygulanan cezaları onaylar." },
  { method: "GET", path: "/api/v1/bans", desc: "Aktif ban listesini çeker (giriş kontrolü için)." },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <span className="section-title text-brand-400">Dokümantasyon</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Başlangıç</h1>
        <p className="mt-4 text-slate-400">
          Core Shield Anti-Cheat&apos;i sunucuna kurmak ve API&apos;yi kullanmak için rehber.
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-white">Kurulum</h2>
          <ol className="mt-4 space-y-3 text-slate-300">
            <li>1. Panelden bir lisans etkinleştir ve sunucu oluştur.</li>
            <li>2. Sunucu ayarlarından API adresi ve token&apos;ını al.</li>
            <li>3. Kaynağı <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm">resources</code> klasörüne ekle.</li>
            <li>4. <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm">ensure aeigs-anticheat</code> ekleyip sunucuyu başlat.</li>
          </ol>
        </section>

        <section id="api" className="mt-14 scroll-mt-20">
          <h2 className="text-xl font-semibold text-white">API Referansı</h2>
          <p className="mt-2 text-sm text-slate-400">
            Tüm istekler <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">Authorization: Bearer &lt;sunucu-token&gt;</code> başlığı gerektirir.
          </p>
          <div className="mt-6 space-y-2">
            {endpoints.map((e) => (
              <Card key={e.path} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                  <Badge tone={e.method === "GET" ? "blue" : "violet"}>{e.method}</Badge>
                  <code className="font-mono text-sm text-slate-200">{e.path}</code>
                </div>
                <p className="text-sm text-slate-400">{e.desc}</p>
              </Card>
            ))}
          </div>
          <p className="mt-6 rounded-xl border border-white/5 bg-base-900/40 px-4 py-3 text-sm text-slate-500">
            Not: FiveM Lua kaynağı ve tam örnek istekler entegrasyon adımında eklenecektir.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
