import en from "./messages/en.json";

type NestedKeyOf<T extends object> = {
  [K in keyof T & string]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & string];

type Messages = typeof en;

let currentMessages: Record<string, unknown> = en;

export function setLocale(messages: Record<string, unknown>) {
  currentMessages = messages;
}

export function t(key: string): string {
  const keys = key.split(".");
  let value: unknown = currentMessages;
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      let fallback: unknown = en;
      for (const fk of keys) {
        if (fallback && typeof fallback === "object" && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          return key; // Return key if not found
        }
      }
      return typeof fallback === "string" ? fallback : key;
    }
  }
  return typeof value === "string" ? value : key;
}
