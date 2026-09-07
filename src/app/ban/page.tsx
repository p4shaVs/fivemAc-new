import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BanLookup } from "./ban-lookup";

export const metadata: Metadata = { title: "Ban Sorgulama" };

export default function BanPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span className="section-title text-brand-400">Ban Sorgulama</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ban kodunu gir
          </h1>
          <p className="mt-3 text-slate-400">
            Oyundan atıldığında sana gösterilen kodu (örn. <span className="font-mono text-slate-300">AC-XXXXXX</span>) girerek ban sebebini görebilirsin.
          </p>
        </div>
        <div className="mt-8">
          <BanLookup />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
