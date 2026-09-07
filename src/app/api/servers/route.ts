import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { handler, ok, requireUser, ApiError } from "@/lib/api";
import { createServerSchema } from "@/lib/validation";
import { generateServerToken } from "@/lib/keys";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/session";

export const POST = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const body = createServerSchema.parse(await req.json());

  const license = await db.licenseKey.findFirst({
    where: { id: body.licenseKeyId, ownerId: user.id },
    include: { servers: true },
  });
  if (!license) throw new ApiError(404, "Lisans bulunamadı");
  if (license.status === "REVOKED" || license.status === "SUSPENDED") {
    throw new ApiError(403, "Bu lisans kullanılamaz durumda");
  }
  if (license.expiresAt && license.expiresAt < new Date()) {
    throw new ApiError(403, "Lisansın süresi dolmuş");
  }
  if (license.servers.length >= license.maxServers) {
    throw new ApiError(409, "Bu lisans için sunucu limiti dolmuş");
  }

  const { token, hash } = generateServerToken();

  const server = await db.$transaction(async (tx) => {
    const s = await tx.server.create({
      data: {
        name: body.name,
        ip: body.ip ?? null,
        ownerId: user.id,
        licenseKeyId: license.id,
        apiTokenHash: hash,
      },
    });
    // İlk aktivasyonda lisansı ACTIVE yap.
    if (license.status === "UNUSED") {
      await tx.licenseKey.update({
        where: { id: license.id },
        data: { status: "ACTIVE", activatedAt: new Date() },
      });
    }
    await tx.serverLog.create({
      data: {
        serverId: s.id,
        level: "INFO",
        source: "system",
        message: `Sunucu oluşturuldu: ${s.name}`,
      },
    });
    return s;
  });

  await audit({
    userId: user.id,
    action: "SERVER_CREATE",
    targetType: "Server",
    targetId: server.id,
    ip: clientIp(headers()),
  });

  // Ham token yalnızca bir kez döndürülür.
  return ok({ serverId: server.id, apiToken: token }, 201);
});
