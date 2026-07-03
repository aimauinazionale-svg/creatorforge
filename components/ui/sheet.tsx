import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "left" | "right";
    closeLabel?: string;
  }
>(({ side = "left", closeLabel, className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 h-full w-80 max-w-[85vw] border-border bg-background p-4 shadow-lg",
        side === "left" ? "left-0 top-0 border-r" : "right-0 top-0 border-l",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:duration-300 data-[state=open]:duration-300",
        side === "left"
          ? "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
          : "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label={closeLabel}
        className={cn(
          "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity",
          "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        <X className="h-4 w-4" aria-hidden="true" />
        {closeLabel ? <span className="sr-only">{closeLabel}</span> : null}
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

