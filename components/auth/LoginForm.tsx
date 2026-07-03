"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";

import { signInWithGoogle, signInWithMagicLink } from "@/app/actions/auth";
import { callServerAction } from "@/lib/actions/call-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [googlePending, startGoogleTransition] = React.useTransition();

  function showAuthError(code: string) {
    const key = `errors.${code}` as "errors.AUTH_ERROR";
    const message = t.has(key) ? t(key) : tCommon("errors.UNKNOWN");
    toast({
      variant: "destructive",
      title: t("toast.error"),
      description: message,
    });
  }

  function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await callServerAction(() => signInWithMagicLink(email, locale));
      if (!res.ok) {
        showAuthError(res.error.code);
        return;
      }
      setSent(true);
      toast({ title: t("toast.magicLinkSent") });
    });
  }

  function onGoogleSignIn() {
    startGoogleTransition(async () => {
      const res = await callServerAction(() => signInWithGoogle(locale));
      if (!res.ok) {
        showAuthError(res.error.code);
        return;
      }
      if (res.redirectUrl) {
        window.location.assign(res.redirectUrl);
      }
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("cardTitle")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("cardSubtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={googlePending || pending}
          onClick={onGoogleSignIn}
        >
          {googlePending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {t("google")}
        </Button>

        <p className="text-center text-xs text-muted-foreground">{t("orEmail")}</p>

        {sent ? (
          <p className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            {t("magicLink.sentBody", { email })}
          </p>
        ) : (
          <form onSubmit={onMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("magicLink.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("magicLink.emailPlaceholder")}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={pending || googlePending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Mail className="h-4 w-4" aria-hidden="true" />
              )}
              {pending ? t("magicLink.submitting") : t("magicLink.submit")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
