import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { PanelShell, type NavSection } from "@/components/panel-shell";

const nav: NavSection[] = [
  {
    title: "Genel",
    items: [
      { href: "/admin", label: "Gösterge Paneli", icon: "dashboard", exact: true },
      { href: "/admin/servers", label: "Sunucular", icon: "server" },
    ],
  },
  {
    title: "Satış",
    items: [
      { href: "/admin/products", label: "Ürünler", icon: "cube" },
      { href: "/admin/keys", label: "Lisans Anahtarları", icon: "key" },
    ],
  },
  {
    title: "Yönetim",
    items: [
      { href: "/admin/users", label: "Kullanıcılar", icon: "users" },
      { href: "/admin/audit", label: "Denetim Kaydı", icon: "logs" },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <PanelShell nav={nav} user={user} variant="admin">
      {children}
    </PanelShell>
  );
}
