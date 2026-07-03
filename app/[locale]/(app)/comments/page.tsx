import { getTranslations } from "next-intl/server";



import { CommentSentimentPanel } from "@/components/comments/CommentSentimentPanel";

import { PageHeader } from "@/components/shared/PageHeader";



export default async function CommentsPage() {

  const t = await getTranslations("comments");



  return (

    <div className="mx-auto w-full max-w-6xl space-y-6">

      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <CommentSentimentPanel />

    </div>

  );

}

