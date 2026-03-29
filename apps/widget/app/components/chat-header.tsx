"use client";

import { Minus } from "lucide-react";
import type { WidgetConfig } from "../hooks/use-widget-config";

interface ChatHeaderProps {
  config: WidgetConfig;
  onMinimize: () => void;
}

export function ChatHeader({ config, onMinimize }: ChatHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ backgroundColor: "var(--widget-primary)" }}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {config.organizationName.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {config.organizationName}
          </p>
          <p className="text-xs text-white/70">Typically replies instantly</p>
        </div>
      </div>
      <button
        onClick={onMinimize}
        className="rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Minimize chat"
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}
