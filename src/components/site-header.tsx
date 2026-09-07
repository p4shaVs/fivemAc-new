import Link from "next/link";
import { Logo, LinkButton } from "./ui";
import { getCurrentUser } from "@/lib/session";

const NAV = [
  { href: "/#features", label: "Özellikler" },
  { href: "/#demo", label: "Demo" },
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/#faq", label: "SSS" },
  { href: "/docs", label: "Dokümantasyon" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <LinkButton
                href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                variant="secondary"
              >
                Panele Git
              </LinkButton>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block"
              >
                Giriş Yap
              </Link>
              <LinkButton href="/register" icon="arrowRight">
                Ücretsiz Başla
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-base-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-slate-500">
              FiveM sunucunuz için yeni nesil anti-cheat koruması, gerçek zamanlı
              tespit ve tam yönetim paneli.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterCol
              title="Ürün"
              links={[
                { href: "/#features", label: "Özellikler" },
                { href: "/pricing", label: "Fiyatlandırma" },
                { href: "/#detection", label: "Koruma" },
              ]}
            />
            <FooterCol
              title="Kaynaklar"
              links={[
                { href: "/docs", label: "Dokümantasyon" },
                { href: "/docs#api", label: "API Referansı" },
                { href: "/ban", label: "Ban Sorgula" },
              ]}
            />
            <FooterCol
              title="Hesap"
              links={[
                { href: "/login", label: "Giriş" },
                { href: "/register", label: "Kayıt" },
                { href: "/dashboard", label: "Panel" },
              ]}
            />
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-slate-600 sm:flex-row">
          <p>© {new Date().getFullYear()} Core Shield Anti-Cheat. Tüm hakları saklıdır.</p>
          <p>FiveM, Cfx.re'nin ticari markasıdır. Bu proje bağımsızdır.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="section-title mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-sm text-slate-500 transition hover:text-slate-200"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
