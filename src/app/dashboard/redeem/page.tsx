import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui";
import { Icons } from "@/components/icons";
import { RedeemForm } from "./redeem-form";

export const metadata: Metadata = { title: "Kod Kullan" };

export default function RedeemPage() {
  return (
    <>
      <PageHeader
        title="Kod Kullan"
        description="Sana verilen lisans anahtarını girerek hesabına ekle."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <Icons.gift size={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">Lisans Anahtarı</h3>
              <p className="text-xs text-slate-500">AEIGS-XXXX-XXXX-XXXX-XXXX formatında</p>
            </div>
          </div>
          <RedeemForm />
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-white">Nasıl çalışır?</h3>
          <ol className="space-y-3 text-sm text-slate-400">
            {[
              "Anahtarını yukarıdaki alana yapıştır.",
              "Anahtar hesabına eklenir ve 'Lisanslarım' altında görünür.",
              "Oradan bir sunucu oluşturarak korumayı başlat.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-semibold text-brand-300 ring-1 ring-inset ring-white/10">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
