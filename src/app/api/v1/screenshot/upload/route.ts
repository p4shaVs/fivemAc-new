import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// screenshot-basic görseli buraya (multipart) yükler. Kimlik doğrulaması
// oyuncunun client'ından geldiği için Bearer yerine ?rid=<istekId> ile bağlanır;
// yalnızca PENDING bir ScreenshotRequest'e ait rid kabul edilir.
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const rid = new URL(req.url).searchParams.get("rid");
    if (!rid) return fail(400, "rid gerekli");

    const reqRow = await db.screenshotRequest.findUnique({ where: { id: rid } });
    if (!reqRow) return fail(404, "İstek bulunamadı");
    if (reqRow.status !== "PENDING") return fail(409, "İstek zaten tamamlanmış");

    const form = await req.formData();
    // screenshot-basic 'files[]' alanıyla gönderir; ilk dosyayı al.
    let file: File | null = null;
    for (const [, v] of form.entries()) {
      if (v instanceof File) { file = v; break; }
    }
    if (!file) return fail(400, "Dosya yok");

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_BYTES) return fail(413, "Geçersiz dosya boyutu");

    // public/shots/<rid>.jpg olarak kaydet (statik sunulur).
    const dir = path.join(process.cwd(), "public", "shots");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${rid}.jpg`), buf);

    const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
    const url = `${base}/shots/${rid}.jpg`;

    await db.screenshotRequest.update({
      where: { id: rid },
      data: { status: "DONE", url, completedAt: new Date() },
    });

    // screenshot-basic dönen JSON'dan url okur; client'a da iletelim.
    return Response.json({ url });
  } catch (e) {
    console.error("[SS_UPLOAD]", e);
    return fail(500, "Yükleme hatası");
  }
}
