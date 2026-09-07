import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, Card, EmptyState, LinkButton, Badge } from "@/components/ui";
import { Icons } from "@/components/icons";

export const metadata: Metadata = { title: "İndir" };
export const dynamic = "force-dynamic";

export default async function DownloadPage() {
  const user = (await getCurrentUser())!;
  const hasLicense = await db.licenseKey.count({
    where: { ownerId: user.id, status: { in: ["ACTIVE", "UNUSED"] } },
  });

  if (!hasLicense) {
    return (
      <>
        <PageHeader title="İndir" description="Anti-cheat kaynağını indir." />
        <EmptyState
          icon="download"
          title="İndirmek için aktif bir lisans gerekli"
          description="Bir paket satın al veya kodunu etkinleştir."
          action={
            <LinkButton href="/pricing" icon="cart">
              Lisans Al
            </LinkButton>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="İndir"
        description="En güncel anti-cheat kaynağını indir ve sunucuna kur."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                <Icons.cube size={22} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">aeigs-anticheat</h3>
                <p className="text-xs text-slate-500">FiveM kaynağı (resource)</p>
              </div>
            </div>
            <Badge tone="blue">v4.7.0</Badge>
          </div>

          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/80">
            <Icons.bolt size={16} className="mr-1.5 inline text-amber-300" />
            FiveM kaynağı yarınki entegrasyon adımında yayınlanacak. Panel ve API
            tarafı şu an hazır — sunucunu ekleyip token&apos;ını alabilirsin.
          </div>

          <div className="mt-5 flex gap-2">
            <button className="btn-primary" disabled>
              <Icons.download size={16} /> İndir (yakında)
            </button>
            <LinkButton href="/docs" variant="secondary" icon="book">
              Kurulum Rehberi
            </LinkButton>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Kurulum Adımları</h3>
          <ol className="space-y-3 text-sm text-slate-400">
            {[
              "Kaynağı resources klasörüne çıkar.",
              "server.cfg içine ensure aeigs-anticheat ekle.",
              "Config dosyasına API adresi ve token'ını gir.",
              "Sunucuyu başlat — panelde çevrimiçi görünür.",
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
