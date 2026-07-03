import { getTranslations } from "next-intl/server";

import { PRIVACY_SECTIONS, TERMS_SECTIONS } from "@/lib/legal/sections";
import { cn } from "@/lib/utils";

type LegalNamespace = "legalPages.privacy" | "legalPages.terms";

type LegalDocumentProps = {
  namespace: LegalNamespace;
};

function getSectionKeys(namespace: LegalNamespace) {
  return namespace === "legalPages.privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS;
}

function getListItems(
  raw: unknown
): string[] {
  if (!raw || typeof raw !== "object") return [];
  return Object.keys(raw)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => (raw as Record<string, string>)[key])
    .filter(Boolean);
}

/** Renders a structured legal page (privacy or terms) from next-intl translations. */
export async function LegalDocument({ namespace }: LegalDocumentProps) {
  const t = await getTranslations(namespace);
  const sectionKeys = getSectionKeys(namespace);
  const contactEmail = t("contact.email");

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <header className="space-y-3 border-b border-border/60 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lastUpdated")}</p>
        <p className="text-base leading-relaxed text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="mt-10 space-y-10">
        {sectionKeys.map((key) => {
          const items = getListItems(t.raw(`sections.${key}.items`));

          return (
            <section key={key} aria-labelledby={`${namespace}-${key}`}>
              <h2
                id={`${namespace}-${key}`}
                className="text-xl font-semibold tracking-tight"
              >
                {t(`sections.${key}.title`)}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t(`sections.${key}.body`)}
              </p>
              {items.length > 0 ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
                  {items.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>

      <footer
        className={cn(
          "mt-12 rounded-xl border border-border/60 bg-muted/20 p-6",
          "text-sm leading-relaxed text-muted-foreground"
        )}
      >
        <h2 className="text-base font-semibold text-foreground">{t("contact.title")}</h2>
        <p className="mt-2">
          {t("contact.body", { email: contactEmail })}
        </p>
        <a
          href={`mailto:${contactEmail}`}
          className="mt-2 inline-flex min-h-11 items-center font-medium text-foreground underline-offset-4 hover:underline"
        >
          {contactEmail}
        </a>
      </footer>
    </article>
  );
}
