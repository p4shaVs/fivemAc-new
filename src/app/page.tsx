import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { LinkButton } from "@/components/ui";
import { Icons } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { HeroParallax } from "@/components/hero-parallax";
import { Faq } from "@/components/faq";
import { Testimonials } from "@/components/testimonials";
import { PricingTiers } from "@/components/pricing-tiers";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <TestimonialsSection />
        <FaqSection />
        <PricingSection />
        <NeedHelp />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------- HERO ---------------------------------- */

function Hero() {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-faint [background-size:46px_46px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
        <div>
          <h1 className="animate-slide-up text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Core Shield{" "}
            <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent-violet bg-clip-text text-transparent">
              Anti-Cheat
            </span>
          </h1>
          <p className="mt-6 max-w-lg animate-slide-up text-lg text-slate-400 [animation-delay:80ms]">
            FiveM için <em className="font-semibold not-italic text-slate-200">en gelişmiş</em>{" "}
            anti-cheat — hilecileri sunucundan uzak tutmak için tasarlandı.
          </p>
          <div className="mt-8 flex animate-slide-up flex-col gap-3 [animation-delay:160ms] sm:flex-row">
            <LinkButton href="/pricing" icon="bolt" className="px-6 py-3 text-base">
              Fiyatlandırma
            </LinkButton>
            <LinkButton href="/api/demo" variant="secondary" icon="cube" className="px-6 py-3 text-base">
              Demo
            </LinkButton>
          </div>
          <div className="mt-8 flex animate-fade-in items-center gap-3 [animation-delay:240ms]">
            <div className="flex -space-x-2">
              {["from-brand-500 to-accent-violet", "from-emerald-500 to-cyan-500", "from-amber-500 to-rose-500", "from-purple-500 to-brand-500"].map((g, i) => (
                <span key={i} className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${g} ring-2 ring-base-950 text-[10px] font-bold text-white`}>
                  {["A", "R", "M", "K"][i]}
                </span>
              ))}
            </div>
            <span className="text-sm text-slate-400">
              <span className="font-bold text-white">6000+</span> müşteri güveniyor
            </span>
          </div>
        </div>

        <div className="animate-scale-in [animation-delay:120ms]">
          <HeroParallax />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- FEATURES -------------------------------- */

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
      <Reveal className="text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Özellikler</h2>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-5">
        {/* Web Panel (geniş) */}
        <Reveal className="md:col-span-3">
          <FeatureCard icon="globe" title="Web Panel" text="Sunucunu web panelinden yönet. Admin ekle, ayarları değiştir.">
            <WebPanelMock />
          </FeatureCard>
        </Reveal>
        {/* User Lookup */}
        <Reveal delay={100} className="md:col-span-2">
          <FeatureCard icon="search" title="Oyuncu Sorgulama" text="Sunucuna katılmış herhangi bir oyuncuyu sorgula.">
            <LookupMock />
          </FeatureCard>
        </Reveal>
        {/* Ingame Map */}
        <Reveal className="md:col-span-2">
          <FeatureCard icon="map" title="İnteraktif Harita" text="Sunucundaki oyuncu konumları ve aktivitesi canlı.">
            <MapMock />
          </FeatureCard>
        </Reveal>
        {/* Monitoring (geniş) */}
        <Reveal delay={100} className="md:col-span-3">
          <FeatureCard icon="eye" title="İzleme (Monitoring)" text="Birden fazla oyuncunun ekranını aynı anda izle.">
            <MonitoringMock />
          </FeatureCard>
        </Reveal>
        {/* Ingame Menu (geniş) */}
        <Reveal className="md:col-span-3">
          <FeatureCard icon="config" title="Oyun İçi Menü" text="Banları kaldır, oyuncuları izle, araç spawn et — oyunun içinden.">
            <IngameMenuMock />
          </FeatureCard>
        </Reveal>
        {/* Session Replay */}
        <Reveal delay={100} className="md:col-span-2">
          <FeatureCard icon="activity" title="Oturum Tekrarı" text="Bir oyuncunun tüm FiveM oturumunu tekrar izle.">
            <ReplayMock />
          </FeatureCard>
        </Reveal>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        <LinkButton href="/#pricing" variant="secondary">Neden biz?</LinkButton>
        <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white">
          Diğer anti-cheat&apos;lerle karşılaştır <Icons.arrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  children,
}: {
  icon: any;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  const Icon = (Icons as any)[icon];
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-base-850/60 p-4 transition hover:border-brand-500/25">
      <div className="relative mb-4 flex-1 overflow-hidden rounded-xl border border-white/5 bg-base-900/60">
        {children}
      </div>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-300">
          <Icon size={18} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

/* --- Feature mockups --- */

function WebPanelMock() {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-white">Server</div>
          <div className="text-[9px] text-slate-500">FiveM server protected by Core Shield</div>
        </div>
        <div className="flex gap-4 text-right">
          <div><div className="text-sm font-bold text-white">282</div><div className="text-[8px] text-slate-500">AVG</div></div>
          <div><div className="text-sm font-bold text-white">656</div><div className="text-[8px] text-slate-500">PEAK</div></div>
        </div>
      </div>
      <div className="h-28">
        <svg viewBox="0 0 320 100" className="h-full w-full" preserveAspectRatio="none">
          <defs><linearGradient id="wp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6366f1" stopOpacity="0.4" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
          <path d="M0,80 C40,78 55,40 90,42 C120,44 130,20 170,22 C210,24 220,60 260,55 C290,51 305,58 320,54 L320,100 L0,100 Z" fill="url(#wp)" />
          <path d="M0,80 C40,78 55,40 90,42 C120,44 130,20 170,22 C210,24 220,60 260,55 C290,51 305,58 320,54" fill="none" stroke="#818cf8" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="mt-2 flex gap-2 text-[8px] text-slate-500">
        {["Delete Vehicles", "Delete Peds", "Delete Objects"].map((b) => (
          <span key={b} className="rounded border border-white/10 px-2 py-1">{b}</span>
        ))}
      </div>
    </div>
  );
}

function LookupMock() {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-base-850/60 px-2.5 py-2">
        <Icons.ban size={13} className="text-rose-300" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] text-slate-200">Ace Roleplay — ban kaydı</div>
          <div className="text-[8px] text-slate-500">Entity created in script startup</div>
        </div>
      </div>
      <div className="rounded-lg border border-white/5 bg-base-850/60 p-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-[9px] font-bold text-white">A</span>
          <div><div className="text-[10px] text-slate-200">Akin</div><div className="text-[8px] text-slate-500">discord · 8/22/2024</div></div>
        </div>
        <div className="mt-2 rounded bg-emerald-500/10 px-2 py-1 text-[8px] text-emerald-300">Herhangi bir hile Discord&apos;unda değil</div>
      </div>
      <div className="flex items-center justify-center pt-1">
        <Icons.search size={18} className="text-slate-600" />
      </div>
    </div>
  );
}

function MapMock() {
  return (
    <div className="relative h-full min-h-[150px] bg-gradient-to-br from-emerald-900/20 via-base-900 to-brand-900/20">
      <div className="absolute inset-0 bg-grid-faint [background-size:20px_20px] opacity-40" />
      {[[20, 30], [50, 45], [70, 25], [35, 65], [80, 60], [60, 75], [25, 50], [45, 20]].map(([x, y], i) => (
        <span key={i} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-black/40"
          style={{ left: `${x}%`, top: `${y}%`, background: i % 3 === 0 ? "#f43f5e" : i % 3 === 1 ? "#f59e0b" : "#10b981" }} />
      ))}
    </div>
  );
}

function MonitoringMock() {
  return (
    <div className="grid grid-cols-4 gap-1 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="relative aspect-video overflow-hidden rounded bg-gradient-to-br from-slate-700/40 to-base-900">
          <div className="absolute inset-0 bg-grid-faint [background-size:8px_8px] opacity-30" />
          <span className="absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 text-[6px] text-slate-300">[{1400 + i}]</span>
        </div>
      ))}
    </div>
  );
}

function IngameMenuMock() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      <div>
        <div className="text-[10px] font-semibold text-white">Duyuru</div>
        <div className="mt-1.5 h-6 rounded border border-white/5 bg-base-850/60" />
        <div className="mt-1.5 h-10 rounded border border-white/5 bg-base-850/60" />
        <div className="mt-1.5 rounded bg-brand-500/80 py-1 text-center text-[9px] font-medium text-white">Gönder</div>
      </div>
      <div>
        <div className="text-[10px] font-semibold text-white">Admin</div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {["Delete Vehicles", "Delete Peds", "ESP", "Freecam", "Passive", "Blips"].map((b) => (
            <span key={b} className="rounded border border-white/10 bg-white/5 px-1.5 py-1 text-[7px] text-slate-300">{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReplayMock() {
  return (
    <div className="relative h-full min-h-[150px] bg-gradient-to-br from-slate-800/40 to-base-900">
      <div className="absolute inset-0 bg-grid-faint [background-size:16px_16px] opacity-25" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10"><div className="h-full w-1/3 bg-brand-400" /></div>
    </div>
  );
}

/* --------------------------- TESTIMONIALS ------------------------------ */

function TestimonialsSection() {
  return (
    <section className="border-y border-white/5 bg-base-900/30 py-20">
      <Reveal className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Müşterilerimiz Ne Diyor
        </h2>
      </Reveal>
      <Testimonials />
    </section>
  );
}

/* ------------------------------- FAQ ----------------------------------- */

function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <Reveal className="mb-12 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Sıkça Sorulan Sorular
        </h2>
      </Reveal>
      <Faq />
    </section>
  );
}

/* ----------------------------- PRICING --------------------------------- */

function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
      <Reveal className="mb-12 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Planını Seç</h2>
      </Reveal>
      <PricingTiers />
    </section>
  );
}

/* ---------------------------- NEED HELP -------------------------------- */

function NeedHelp() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <Reveal className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 bg-base-900/50 p-8 sm:p-10 lg:flex-row lg:items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">Yardıma mı ihtiyacın var?</h3>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Ürünümüz hakkında soruların veya önerilerin varsa bize ulaş. Destekten
            önce lütfen dokümantasyona göz at.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <LinkButton href="/docs" variant="secondary" icon="book">Dokümantasyon</LinkButton>
          <LinkButton href="/register" icon="discord">Discord&apos;a Katıl</LinkButton>
        </div>
      </Reveal>
    </section>
  );
}
