import { getTranslations } from "next-intl/server";

import { ChatPanel } from "@/components/ai-assistant/ChatPanel";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function AiAssistantPage() {
  const t = await getTranslations("aiAssistant");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ChatPanel />
    </div>
  );
}
