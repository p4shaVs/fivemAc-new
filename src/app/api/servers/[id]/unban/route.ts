import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { requireOwnedServer } from "@/lib/api-guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/session";

const schema = z.object({ banId: z.string().min(1) });

export const POST = handler(
  async (req: NextRequest, ctx: { params: { id: string } }) => {
    const { server, user } = await requireOwnedServer(ctx.params.id);
    const body = schema.parse(await req.json());

    const ban = await db.ban.findFirst({
      where: { id: body.banId, serverId: server.id, active: true },
    });
    if (!ban) throw new ApiError(404, "Aktif ban bulunamadı");

    await db.$transaction(async (tx) => {
      await tx.ban.update({
        where: { id: ban.id },
        data: { active: false, unbannedAt: new Date(), unbannedBy: user.username },
      });
      // FiveM'e iletilecek UNBAN aksiyonu
      await tx.punishAction.create({
        data: {
          serverId: server.id,
          playerId: ban.playerId,
          type: "UNBAN",
          reason: "Web panelinden ban kaldırıldı",
          issuedBy: user.username,
          playerName: ban.playerName,
          status: "PENDING",
        },
      });
      await tx.serverLog.create({
        data: {
          serverId: server.id,
          level: "INFO",
          source: "panel",
          message: `UNBAN → ${ban.playerName} — ${user.username}`,
        },
      });
    });

    await audit({
      userId: user.id,
      action: "UNBAN",
      targetType: "Ban",
      targetId: ban.id,
      ip: clientIp(headers()),
    });

    return ok({ success: true });
  }
);
