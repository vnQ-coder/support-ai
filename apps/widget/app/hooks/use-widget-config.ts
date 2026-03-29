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

    const fetchConfig = async () => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/v1/widget/config?key=${encodeURIComponent(apiKey)}`
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
        setError(err instanceof Error ? err.message : "Configuration error");
        setConfig(DEFAULT_CONFIG);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [apiKey, apiBaseUrl]);

  return { config, isLoading, error };
}
