import { getOwnedServer } from "@/lib/guards";
import { parseJson } from "@/lib/utils";
import { sanitizeRules } from "@/lib/rules";
import { sanitizeActions } from "@/lib/detection-actions";
import { ConfigTabs } from "./config-tabs";

export const dynamic = "force-dynamic";

export default async function RulesPage({
  params,
}: {
  params: { id: string };
}) {
  const { server } = await getOwnedServer(params.id);
  const config = parseJson<{ rules?: Record<string, boolean>; actions?: Record<string, string> }>(
    server.config,
    {}
  );
  const rules = sanitizeRules(config.rules);
  const actions = sanitizeActions(config.actions);

  return <ConfigTabs serverId={server.id} initialRules={rules} initialActions={actions} />;
}
