import { getTranslations } from "next-intl/server";
import { ChevronRight, Crown, ImageIcon, MessageCircle, User } from "lucide-react";

import { getServerUser } from "@/lib/auth/session";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  const t = await getTranslations("emails.settings");
  const user = await getServerUser();

  const links = [
    {
      href: "/settings/billing",
      icon: Crown,
      title: t("billingTitle"),
      subtitle: t("billingSubtitle"),
    },
    {
      href: "/settings/emails",
      icon: ChevronRight,
      title: t("emailTitle"),
      subtitle: t("emailSubtitle"),
    },
    {
      href: "/thumbnail",
      icon: ImageIcon,
      title: t("thumbnailTitle"),
      subtitle: t("thumbnailSubtitle"),
    },
    {
      href: "/comments",
      icon: MessageCircle,
      title: t("commentsTitle"),
      subtitle: t("commentsSubtitle"),
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15">
            <User className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="font-medium">{user?.name ?? t("profileFallback")}</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between gap-4 border-b border-border/60 px-6 py-4 transition-colors last:border-0 hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{link.title}</p>
                <p className="text-sm text-muted-foreground">{link.subtitle}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
