"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type MobileMenuProps = {
  className?: string;
};

export function MobileMenu({ className }: MobileMenuProps) {
  const t = useTranslations();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("h-11 w-11", className)}
          aria-label={t("layout.sidebar.open")}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" closeLabel={t("layout.sidebar.close")} className="w-[min(100vw-2rem,16rem)] p-0">
        <div className="px-3 pb-4 pt-4">
          <Sidebar mobile />
        </div>
      </SheetContent>
    </Sheet>
  );
}

