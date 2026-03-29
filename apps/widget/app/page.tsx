import { ChatWidget } from "./components/chat-widget";

interface WidgetPageProps {
  searchParams: Promise<{ apiKey?: string; host?: string }>;
}

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const params = await searchParams;

  const apiKey = params.apiKey ?? "";
  const apiBaseUrl = params.host ?? "http://localhost:3002";

  if (!apiKey) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-medium text-red-500">Missing API Key</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The widget requires a valid API key to function.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <ChatWidget apiKey={apiKey} apiBaseUrl={apiBaseUrl} />
    </div>
  );
}
