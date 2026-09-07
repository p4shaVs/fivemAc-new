import { Icons } from "./icons";

// electron-services'teki "What Our Customers Say" — iki yönde kayan yorum kartları.
const REVIEWS = [
  { name: "Vengeance", text: "Beau ve ekibin desteği harika. FG'den iki kat daha iyi, kesinlikle tavsiye ederim." },
  { name: "L. Young", text: "Kurulumu çok kolay, topluluk yardımsever ve destek hızlı. Bu muhteşem anti-cheat için teşekkürler!" },
  { name: "Dante C", text: "10/10 müşteri hizmeti! Karşılaştığım en iyilerden. Güvenilirlik arayan herkese tavsiye ederim." },
  { name: "DENZEL.NL", text: "İnanılmaz hızlı yanıt ve harika koruma. En üst düzey güvenlik isteyen herkese öneririm." },
  { name: "Leepiciu", text: "Olağanüstü hizmet ve performans. Genel olarak muhteşem bir iş çıkarıyorlar!" },
  { name: "Cxetive", text: "En iyi anti-cheat, 10/10 destek. Web panel tasarımı ve oyun içi menü tüm hilecileri durduruyor." },
  { name: "Avalaunch", text: "Diğerlerinden çok daha üst seviye ve 7/24 destek sağlıyor. Herkese tavsiye ederim." },
  { name: "Redas", text: "Piyasadaki en iyi ve en uygun fiyatlı. Web panel tasarımı harika." },
];

function Stars() {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
        </svg>
      ))}
    </div>
  );
}

function Card({ r }: { r: { name: string; text: string } }) {
  return (
    <div className="w-80 shrink-0 rounded-2xl border border-white/5 bg-base-850/60 p-5">
      <p className="text-sm leading-relaxed text-slate-300">{r.text}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-200">— {r.name}</span>
        <Stars />
      </div>
    </div>
  );
}

function Row({ items, reverse }: { items: typeof REVIEWS; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="group flex gap-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className={"flex shrink-0 gap-4 " + (reverse ? "animate-marquee-rev" : "animate-marquee") + " group-hover:[animation-play-state:paused]"}>
        {doubled.map((r, i) => (
          <Card key={i} r={r} />
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  const half = Math.ceil(REVIEWS.length / 2);
  return (
    <div className="space-y-4">
      <Row items={REVIEWS.slice(0, half)} />
      <Row items={REVIEWS.slice(half)} reverse />
    </div>
  );
}
