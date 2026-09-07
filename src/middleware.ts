import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/jwt";
import { SESSION_COOKIE } from "@/lib/session";

// Edge middleware: /dashboard ve /admin için kaba erişim kontrolü.
// DB doğrulaması route/sayfa seviyesinde (getCurrentUser) yeniden yapılır.

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySession(token) : null;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");

  // Giriş yapmamışsa korumalı alanları engelle (kaba kontrol; DB doğrulaması
  // sayfa/layout seviyesinde tekrar yapılır).
  if ((isDashboard || isAdmin) && !claims) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Admin alanı yalnızca ADMIN (JWT rolüne göre kaba kontrol).
  if (isAdmin && claims?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // NOT: Giriş sayfalarında "zaten girişli → panele at" yönlendirmesi
  // BİLEREK middleware'de YAPILMAZ. Aksi halde DB oturumu silinmiş ama JWT
  // çerezi hâlâ duran bir kullanıcıda /login ⇄ /panel sonsuz döngüsü oluşur.
  // Bu kontrol login/register sayfalarında DB doğrulamasıyla yapılır.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
