"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { m } from "@/components/landing/LandingMotion";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const items = ["0", "1", "2", "3", "4", "5"] as const;

export function FAQ() {
  const t = useTranslations("landing.faq");

  return (
    <section id="faq" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <m.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
        <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto mt-10 max-w-3xl"
      >
        <Accordion.Root type="single" collapsible className="space-y-3">
          {items.map((id) => (
            <Accordion.Item key={id} value={id} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <Accordion.Header>
                <Accordion.Trigger
                  className={cn(
                    "group flex w-full items-center justify-between gap-4 px-5 py-4 text-left",
                    "text-sm font-semibold text-foreground hover:bg-muted/20 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <span>{t(`items.${id}.q`)}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="accordion-content overflow-hidden">
                <div className="px-5 pb-5 text-sm text-muted-foreground">{t(`items.${id}.a`)}</div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </m.div>
    </section>
  );
}

