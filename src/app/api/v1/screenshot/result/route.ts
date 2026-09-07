import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { authenticateServer } from "@/lib/server-auth";

// Kaynak, alınan ekran görüntüsünün URL'ini geri gönderir.
const schema = z.object({
  id: z.string(),
  url: z.string().url().max(1000).optional(),
  failed: z.boolean().optional(),
});

export const POST = handler(async (req: NextRequest) => {
  const server = await authenticateServer(req);
  const body = schema.parse(await req.json());

  const reqRow = await db.screenshotRequest.findFirst({
    where: { id: body.id, serverId: server.id },
  });
  if (!reqRow) throw new ApiError(404, "İstek bulunamadı");

  await db.screenshotRequest.update({
    where: { id: reqRow.id },
    data: {
      status: body.failed || !body.url ? "FAILED" : "DONE",
      url: body.url ?? null,
      completedAt: new Date(),
    },
  });

  return ok({ received: true });
});
