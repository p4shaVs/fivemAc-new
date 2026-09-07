import { db } from "./db";
import { hashToken } from "./keys";
import { ApiError } from "./api";
import type { Server } from "@prisma/client";

/**
 * FiveM kaynağından gelen istekleri doğrular.
 * Kaynak, `Authorization: Bearer aeigs_srv_...` başlığı gönderir.
 * DB'de yalnızca token'ın HMAC hash'i saklanır.
 */
export async function authenticateServer(req: Request): Promise<Server> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !token.startsWith("aeigs_srv_")) {
    throw new ApiError(401, "Geçersiz sunucu token'ı", "INVALID_TOKEN");
  }

  const server = await db.server.findUnique({
    where: { apiTokenHash: hashToken(token) },
    include: { licenseKey: true },
  });

  if (!server) {
    throw new ApiError(401, "Sunucu bulunamadı veya token geçersiz", "INVALID_TOKEN");
  }

  // Lisans durumu kontrolü
  const lic = (server as any).licenseKey;
  if (lic) {
    if (lic.status === "REVOKED" || lic.status === "SUSPENDED") {
      throw new ApiError(403, "Lisans askıya alınmış veya iptal edilmiş", "LICENSE_INACTIVE");
    }
    if (lic.expiresAt && new Date(lic.expiresAt) < new Date()) {
      throw new ApiError(403, "Lisansın süresi dolmuş", "LICENSE_EXPIRED");
    }
  }

  return server;
}
