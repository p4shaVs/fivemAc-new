import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { handler, ok, requireUser, ApiError } from "@/lib/api";
import { activateServerSchema } from "@/lib/validation";
import { generateServerToken, isValidKeyFormat } from "@/lib/keys";
import { rateLimit } from "@/lib/ratelimit";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/session";

// FeloxAC tarzı tek-adım kurulum: lisans anahtarını gir, IP/port/ad ver,
// anahtar hesaba tanımlanır (gerekirse) + sunucu oluşturulur + token döner.
export const POST = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const ip = clientIp(headers()) ?? "unknown";
  const rl = rateLimit(`activate:${user.id}:${ip}`, 10, 60_000);
  if (!rl.success) throw new ApiError(429, "Çok fazla deneme, lütfen bekleyin");

  const body = activateServerSchema.parse(await req.json());
  if (!isValidKeyFormat(body.key)) throw new ApiError(400, "Geçersiz lisans anahtarı formatı");

  const license = await db.licenseKey.findUnique({
    where: { key: body.key },
    include: { servers: true },
  });
  if (!license) throw new ApiError(404, "Lisans anahtarı bulunamadı");
  if (license.status === "REVOKED") throw new ApiError(410, "Bu lisans iptal edilmiş");
  if (license.status === "SUSPENDED") throw new ApiError(403, "Bu lisans askıya alınmış");
  if (license.expiresAt && license.expiresAt < new Date()) throw new ApiError(410, "Lisansın süresi dolmuş");
  if (license.ownerId && license.ownerId !== user.id) throw new ApiError(409, "Bu lisans başka bir hesaba tanımlı");
  if (license.servers.length >= license.maxServers) throw new ApiError(409, "Bu lisans için sunucu limiti dolmuş");

  const { token, hash } = generateServerToken();

  const server = await db.$transaction(async (tx) => {
    // Anahtar sahipsizse hesaba tanımla + ACTIVE yap.
    if (!license.ownerId || license.status === "UNUSED") {
      await tx.licenseKey.update({
        where: { id: license.id },
        data: {
          ownerId: license.ownerId ?? user.id,
          status: "ACTIVE",
          activatedAt: license.activatedAt ?? new Date(),
        },
      });
    }
    const s = await tx.server.create({
      data: {
        name: body.name,
        ip: body.ip ?? null,
        port: body.port,
        ownerId: user.id,
        licenseKeyId: license.id,
        apiTokenHash: hash,
      },
    });
    await tx.serverLog.create({
      data: { serverId: s.id, level: "INFO", source: "system", message: `Sunucu oluşturuldu: ${s.name}` },
    });
    return s;
  });

  await audit({ userId: user.id, action: "SERVER_ACTIVATE", targetType: "Server", targetId: server.id, ip });

  // Ham token yalnızca bir kez döner.
  return ok({ serverId: server.id, apiToken: token }, 201);
});
