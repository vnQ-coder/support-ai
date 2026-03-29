"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EmbedSnippetProps {
  orgId: string;
  widgetUrl: string;
}

export function EmbedSnippet({ orgId, widgetUrl }: EmbedSnippetProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const snippets = {
    html: `<!-- SupportAI Chat Widget -->
<script>
  window.SupportAIConfig = { orgId: "${orgId}" };
</script>
<script src="${widgetUrl}/widget.js" async></script>`,

    react: `// In your layout.tsx or _app.tsx
import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: \`window.SupportAIConfig = { orgId: "${orgId}" }\`,
          }}
        />
        <Script src="${widgetUrl}/widget.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}`,

    shopify: `{%- comment -%} Add before </body> in theme.liquid {%- endcomment -%}
<script>
  window.SupportAIConfig = { orgId: "${orgId}" };
</script>
<script src="${widgetUrl}/widget.js" async></script>`,

    wordpress: `<?php
// Add to functions.php
function supportai_widget() {
    echo '<script>window.SupportAIConfig={orgId:"${orgId}"}</script>';
    echo '<script src="${widgetUrl}/widget.js" async></script>';
}
add_action('wp_footer', 'supportai_widget');`,
  };

  async function copyToClipboard(tab: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Install on Your Website</CardTitle>
            <CardDescription className="mt-1">
              Copy the snippet below and paste it into your website.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {orgId}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="html">
          <TabsList className="mb-4">
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="react">React / Next.js</TabsTrigger>
            <TabsTrigger value="shopify">Shopify</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          </TabsList>
          {Object.entries(snippets).map(([tab, code]) => (
            <TabsContent key={tab} value={tab}>
              <div className="relative">
                <pre className="rounded-lg bg-muted p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  <code>{code}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => copyToClipboard(tab, code)}
                >
                  {copiedTab === tab ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <p className="mt-3 text-xs text-muted-foreground">
          The widget loads asynchronously and won&apos;t affect your page speed.
        </p>
      </CardContent>
    </Card>
  );
}
