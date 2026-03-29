"use client";

import { useState, useEffect } from "react";

export interface WidgetConfig {
  organizationId: string;
  organizationName: string;
  primaryColor: string;
  greeting: string;
  placeholder: string;
  position: "bottom-right" | "bottom-left";
  avatarUrl: string | null;
  showBranding: boolean;
  features: {
    citations: boolean;
    handoff: boolean;
  };
  logoUrl?: string;
  widgetTitle?: string;
  autoOpenDelay?: number;
  preChatFields?: Array<{ name: string; type: string; required: boolean }>;
  theme?: string;
  soundEnabled?: boolean;
  offlineMessage?: string;
  positionOffsetX?: number;
  positionOffsetY?: number;
}

interface UseWidgetConfigResult {
  config: WidgetConfig | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_CONFIG: WidgetConfig = {
  organizationId: "",
  organizationName: "Support",
  primaryColor: "#6366f1",
  greeting: "Hi! How can we help you today?",
  placeholder: "Type a message...",
  position: "bottom-right",
  avatarUrl: null,
  showBranding: true,
  features: { citations: true, handoff: true },
};

export function useWidgetConfig(
  apiKey: string,
  apiBaseUrl: string
): UseWidgetConfigResult {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setConfig(DEFAULT_CONFIG);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchConfig = async () => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/v1/widget/config?key=${encodeURIComponent(apiKey)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? "Invalid API key"
              : res.status === 403
                ? "Widget not authorized for this domain"
                : "Failed to load widget configuration"
          );
        }
        const data = await res.json();
        setConfig(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Configuration error");
        setConfig(DEFAULT_CONFIG);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();

    return () => controller.abort();
  }, [apiKey, apiBaseUrl]);

  return { config, isLoading, error };
}
