"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import { getEmailPreferencesAction, saveEmailPreferencesAction } from "@/app/actions/email";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const EMAIL_TYPES = [
  { key: "weeklyDigestEnabled", label: "weeklyDigest" },
  { key: "competitorAlertsEnabled", label: "competitorAlert" },
  { key: "publishingRemindersEnabled", label: "publishingReminder" },
  { key: "goalReachedEnabled", label: "goalReached" },
  { key: "onboardingEnabled", label: "onboarding" },
] as const;

export function EmailPreferencesForm() {
  const t = useTranslations("emails");
  const { toast } = useToast();
  const [prefs, setPrefs] = React.useState<Record<string, boolean>>({});
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void getEmailPreferencesAction().then((res) => {
      if (res.ok && res.data.prefs) {
        setEmail(res.data.prefs.email);
        setPrefs({
          weeklyDigestEnabled: res.data.prefs.weeklyDigestEnabled,
          competitorAlertsEnabled: res.data.prefs.competitorAlertsEnabled,
          publishingRemindersEnabled: res.data.prefs.publishingRemindersEnabled,
          goalReachedEnabled: res.data.prefs.goalReachedEnabled,
          onboardingEnabled: res.data.prefs.onboardingEnabled,
        });
      }
      setLoading(false);
    });
  }, []);

  async function onSave() {
    setSaving(true);
    const res = await saveEmailPreferencesAction({
      email,
      weeklyDigestEnabled: prefs.weeklyDigestEnabled ?? true,
      competitorAlertsEnabled: prefs.competitorAlertsEnabled ?? true,
      publishingRemindersEnabled: prefs.publishingRemindersEnabled ?? true,
      goalReachedEnabled: prefs.goalReachedEnabled ?? true,
      onboardingEnabled: prefs.onboardingEnabled ?? true,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: t("toast.errorTitle"), description: t("toast.errorBody") });
      return;
    }
    toast({ title: t("toast.savedTitle"), description: t("toast.savedBody") });
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.emailTitle")}</CardTitle>
        {email ? <p className="text-sm text-muted-foreground">{t("preferences.emailLabel")}: {email}</p> : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {EMAIL_TYPES.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 p-4">
              <input
                type="checkbox"
                checked={prefs[key] ?? true}
                onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                className="mt-1"
              />
              <div>
                <p className="font-medium">{t(`types.${label}.title`)}</p>
                <p className="text-sm text-muted-foreground">{t(`types.${label}.description`)}</p>
              </div>
            </label>
          ))}
        </div>
        <Button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? t("actions.saving") : t("actions.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
