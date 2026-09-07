import { PageHeader } from "@/components/ui";
import { NewServerFlow } from "./new-server";

export const dynamic = "force-dynamic";

export default function NewServerPage() {
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  return (
    <>
      <PageHeader
        title="Yeni Sunucu"
        description="Lisans anahtarını gir, sunucunu oluştur ve server.cfg kurulumunu tamamla."
      />
      <NewServerFlow appUrl={appUrl} />
    </>
  );
}
