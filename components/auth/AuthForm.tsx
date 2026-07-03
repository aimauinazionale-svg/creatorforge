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
import { Link } from "@/i18n/navigation";
import { useToast } from "@/hooks/use-toast";

export type AuthFormMode = "login" | "register";

export type AuthFormProps = {
  mode?: AuthFormMode;
};

export function AuthForm({ mode = "login" }: AuthFormProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [googlePending, startGoogleTransition] = React.useTransition();

  const isRegister = mode === "register";
  const cardTitle = isRegister ? t("register.cardTitle") : t("cardTitle");
  const cardSubtitle = isRegister ? t("register.cardSubtitle") : t("cardSubtitle");

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
        <CardTitle>{cardTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{cardSubtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          className="w-full gap-2"
          disabled={googlePending || pending}
          onClick={onGoogleSignIn}
        >
          {googlePending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
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
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2"
              disabled={pending || googlePending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Mail className="h-4 w-4" aria-hidden="true" />
              )}
              {pending ? t("magicLink.submitting") : t("magicLink.submit")}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? t("register.hasAccount") : t("register.noAccount")}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-medium text-rose-600 hover:underline dark:text-pink-400"
          >
            {isRegister ? t("register.signInLink") : t("register.signUpLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
