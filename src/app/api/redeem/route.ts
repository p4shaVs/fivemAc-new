import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { handler, ok, requireUser, ApiError } from "@/lib/api";
import { redeemSchema } from "@/lib/validation";
import { isValidKeyFormat } from "@/lib/keys";
import { rateLimit } from "@/lib/ratelimit";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/session";

export const POST = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const ip = clientIp(headers()) ?? "unknown";

  // Kod tahminini engellemek için sıkı rate limit.
  const rl = rateLimit(`redeem:${user.id}:${ip}`, 8, 60_000);
  if (!rl.success) throw new ApiError(429, "Çok fazla deneme, lütfen bekleyin");

  const body = redeemSchema.parse(await req.json());
  if (!isValidKeyFormat(body.key)) {
    throw new ApiError(400, "Geçersiz anahtar formatı");
  }

  const license = await db.licenseKey.findUnique({ where: { key: body.key } });
  if (!license) throw new ApiError(404, "Anahtar bulunamadı");

  if (license.status === "REVOKED") throw new ApiError(410, "Bu anahtar iptal edilmiş");
  if (license.expiresAt && license.expiresAt < new Date()) {
    throw new ApiError(410, "Bu anahtarın süresi dolmuş");
  }

  if (license.ownerId && license.ownerId !== user.id) {
    throw new ApiError(409, "Bu anahtar başka bir hesaba tanımlı");
  }
  if (license.ownerId === user.id) {
    throw new ApiError(409, "Bu anahtar zaten hesabınızda tanımlı");
  }

  await db.licenseKey.update({
    where: { id: license.id },
    data: { ownerId: user.id },
  });

  await audit({
    userId: user.id,
    action: "REDEEM",
    targetType: "LicenseKey",
    targetId: license.id,
    ip,
  });

  return ok({ licenseKeyId: license.id });
});
