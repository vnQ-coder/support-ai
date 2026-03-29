"use client";
import * as React from "react";
import { cn } from "@repo/ui";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextValue>({ open: false, setOpen: () => {} });

function Popover({ open: controlledOpen, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = React.useCallback((v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  }, [onOpenChange]);
  return <PopoverContext.Provider value={{ open, setOpen }}><div className="relative">{children}</div></PopoverContext.Provider>;
}

function PopoverTrigger({ asChild, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen, open } = React.useContext(PopoverContext);
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>;
    return React.cloneElement(child, { onClick: () => setOpen(!open) });
  }
  return <button type="button" onClick={() => setOpen(!open)} {...props}>{children}</button>;
}

function PopoverContent({ className, children, align: _align, ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end" }) {
  const { open, setOpen } = React.useContext(PopoverContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-2 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
