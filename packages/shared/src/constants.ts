// Application constants

export const APP_NAME = "SupportAI";

export const PLANS = {
  starter: {
    name: "Starter",
    price: 49,
    resolutionsPerMonth: 500,
    channels: 2,
    knowledgeSources: 1,
  },
  growth: {
    name: "Growth",
    price: 99,
    resolutionsPerMonth: 2000,
    channels: "unlimited",
    knowledgeSources: "unlimited",
  },
  pro: {
    name: "Pro",
    price: 199,
    resolutionsPerMonth: 10000,
    channels: "unlimited",
    knowledgeSources: "unlimited",
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    resolutionsPerMonth: "unlimited",
    channels: "unlimited",
    knowledgeSources: "unlimited",
  },
} as const;

export const AI_CONFIDENCE_THRESHOLD = 0.7;

export const MAX_MESSAGE_LENGTH = 10000;

export const SUPPORTED_LANGUAGES = [
  "en", "es", "fr", "de", "pt", "ja", "ko", "zh", "ar", "hi",
  "it", "nl", "pl", "ru", "sv", "th", "tr", "vi", "id", "cs",
  "da", "fi", "el", "he", "hu", "no", "ro", "sk", "uk", "ms",
] as const;

export const RATE_LIMITS = {
  chatMessages: { max: 30, windowMs: 60_000 },
  apiRequests: { max: 100, windowMs: 60_000 },
  widgetInit: { max: 10, windowMs: 60_000 },
} as const;
