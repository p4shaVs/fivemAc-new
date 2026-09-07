import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { requireOwnedServer } from "@/lib/api-guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/session";

export const DELETE = handler(
  async (_req: NextRequest, ctx: { params: { id: string; adminId: string } }) => {
    const { server, user } = await requireOwnedServer(ctx.params.id);
    const admin = await db.serverAdmin.findFirst({
      where: { id: ctx.params.adminId, serverId: server.id },
    });
    if (!admin) throw new ApiError(404, "Yetkili bulunamadı");

    await db.serverAdmin.delete({ where: { id: admin.id } });
    await audit({
      userId: user.id,
      action: "SERVER_ADMIN_REMOVE",
      targetType: "Server",
      targetId: server.id,
      ip: clientIp(headers()),
    });
    return ok({ success: true });
  }
);
