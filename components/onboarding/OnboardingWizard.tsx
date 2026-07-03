"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  completeOnboardingAction,
  getOnboardingStateAction,
  saveOnboardingStepAction,
} from "@/app/actions/onboarding";
import { ConnectYouTube } from "@/components/dashboard/ConnectYouTube";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callServerAction } from "@/lib/actions/call-action";
import { useToast } from "@/hooks/use-toast";

const GOAL_KEYS = ["grow", "consistent", "monetize", "workflow"] as const;

import type { OnboardingData } from "@/lib/actions/types/onboarding";

export type OnboardingWizardProps = {
  initialStep?: number;
};

export function OnboardingWizard({ initialStep = 0 }: OnboardingWizardProps) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState(initialStep);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [data, setData] = React.useState<OnboardingData>({
    goals: [],
    emailFrequency: "weekly",
  });

  React.useEffect(() => {
    void callServerAction(() => getOnboardingStateAction()).then((res) => {
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: tCommon("toast.error"),
          description: tCommon(`errors.${res.error.code}`),
        });
        setStep(initialStep);
        setLoading(false);
        return;
      }
      if (res.data.completed) {
        router.replace(`/${locale}/dashboard`);
        return;
      }
      setStep(res.data.step || 0);
      setData((prev) => ({ ...prev, ...res.data.data }));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  async function persist(nextStep: number, patch?: Partial<OnboardingData>) {
    const merged = { ...data, ...patch, goals: data.goals };
    setData(merged);
    setSaving(true);
    const res = await callServerAction(() => saveOnboardingStepAction(nextStep, merged));
    setSaving(false);
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: tCommon("toast.error"),
        description: t.has(`errors.${res.error.code}`)
          ? t(`errors.${res.error.code}`)
          : tCommon(`errors.${res.error.code}`),
      });
      return false;
    }
    if (process.env.NODE_ENV === "development" && res.data.savedLocally) {
      toast({ title: t("savedLocally") });
    }
    return true;
  }

  async function onNext(patch?: Partial<OnboardingData>) {
    const next = step + 1;
    const ok = await persist(next, patch);
    if (ok) setStep(next);
  }

  async function onFinish() {
    setSaving(true);
    const res = await callServerAction(() => completeOnboardingAction(data));
    setSaving(false);
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: tCommon("toast.error"),
        description: t.has(`errors.${res.error.code}`)
          ? t(`errors.${res.error.code}`)
          : tCommon(`errors.${res.error.code}`),
      });
      return;
    }
    if (process.env.NODE_ENV === "development" && res.data.savedLocally) {
      toast({ title: t("savedLocally") });
    }
    setStep(5);
    window.setTimeout(() => router.push(`/${locale}/dashboard`), 1500);
  }

  function toggleGoal(goal: string) {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
    }));
  }

  if (loading) {
    return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex justify-center gap-2 text-xs text-muted-foreground">
        {[0, 1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={s <= step ? "font-medium text-primary" : undefined}
            aria-current={s === step ? "step" : undefined}
          >
            {s + 1}
          </span>
        ))}
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("steps.welcome.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("steps.welcome.subtitle")}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• {t("steps.welcome.bullets.youtube")}</p>
            <p>• {t("steps.welcome.bullets.goals")}</p>
            <p>• {t("steps.welcome.bullets.personalize")}</p>
            <Button className="mt-4 w-full" onClick={() => void onNext()} disabled={saving}>
              {t("actions.next")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("steps.connectYouTube.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("steps.connectYouTube.subtitle")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConnectYouTube />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                {t("actions.back")}
              </Button>
              <Button variant="outline" onClick={() => void onNext()} disabled={saving}>
                {t("actions.skip")}
              </Button>
              <Button className="flex-1" onClick={() => void onNext()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("actions.next")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("steps.goals.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("steps.goals.subtitle")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {GOAL_KEYS.map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant={data.goals.includes(key) ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => toggleGoal(key)}
                >
                  {t(`steps.goals.options.${key}`)}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-goal">{t("steps.goals.custom.label")}</Label>
              <Input
                id="custom-goal"
                value={data.customGoal ?? ""}
                onChange={(e) => setData((p) => ({ ...p, customGoal: e.target.value }))}
                placeholder={t("steps.goals.custom.placeholder")}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t("actions.back")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => void onNext()}
                disabled={saving || (data.goals.length === 0 && !data.customGoal?.trim())}
              >
                {t("actions.next")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("steps.channelInfo.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("steps.channelInfo.subtitle")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["niche", "audience", "frequency", "experience"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{t(`steps.channelInfo.fields.${field}.label`)}</Label>
                <Input
                  id={field}
                  value={data[field] ?? ""}
                  onChange={(e) => setData((p) => ({ ...p, [field]: e.target.value }))}
                  placeholder={t(`steps.channelInfo.fields.${field}.placeholder`)}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                {t("actions.back")}
              </Button>
              <Button className="flex-1" onClick={() => void onNext()} disabled={saving}>
                {t("actions.next")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("steps.personalization.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("steps.personalization.subtitle")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-freq">{t("steps.personalization.emailFrequency.label")}</Label>
              <select
                id="email-freq"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.emailFrequency}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    emailFrequency: e.target.value as OnboardingData["emailFrequency"],
                  }))
                }
              >
                {(["daily", "weekly", "monthly", "never"] as const).map((opt) => (
                  <option key={opt} value={opt}>
                    {t(`steps.personalization.emailFrequency.options.${opt}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                {t("actions.back")}
              </Button>
              <Button className="flex-1" onClick={() => void onFinish()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("actions.finish")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step >= 5 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{t("steps.complete.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("steps.complete.subtitle")}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
