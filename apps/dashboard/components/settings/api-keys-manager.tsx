"use client";

import { useState, useTransition, useActionState } from "react";
import { Copy, Check, Plus, Key, XCircle } from "lucide-react";
import { createApiKey, revokeApiKey } from "@/app/(dashboard)/settings/actions";
import type { ApiKeyRow } from "@/lib/queries/settings";

interface ApiKeysManagerProps {
  keys: ApiKeyRow[];
}

export function ApiKeysManager({ keys }: ApiKeysManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [modeFilter, setModeFilter] = useState<"all" | "live" | "test">("all");
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [isRevoking, startRevokeTransition] = useTransition();

  const [createState, createAction, isCreating] = useActionState(
    async (_prev: { success: boolean; error?: string; data?: Record<string, unknown> } | null, formData: FormData) => {
      const result = await createApiKey(formData);
      if (result.success && result.data?.key) {
        setNewKey(result.data.key as string);
      }
      return result;
    },
    null
  );

  function handleCopy() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleRevoke(keyId: string) {
    setRevokeError(null);
    startRevokeTransition(async () => {
      const result = await revokeApiKey(keyId);
      if (!result.success) {
        setRevokeError(result.error ?? "Failed to revoke key");
      }
      setRevokeConfirmId(null);
    });
  }

  function closeModal() {
    setShowCreateModal(false);
    setNewKey(null);
    setCopied(false);
  }

  const filteredKeys = keys.filter((key) => {
    if (modeFilter === "live") return key.isLive;
    if (modeFilter === "test") return !key.isLive;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["all", "live", "test"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                modeFilter === mode
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create API Key
        </button>
      </div>

      {/* Error */}
      {revokeError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {revokeError}
        </div>
      )}

      {/* Keys Table */}
      {filteredKeys.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Key className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No API keys found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first API key to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredKeys.map((apiKey) => {
                  const isRevoked = apiKey.revokedAt !== null;
                  return (
                    <tr
                      key={apiKey.id}
                      className={`transition-colors ${
                        isRevoked ? "opacity-50" : "hover:bg-muted/50"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {apiKey.name}
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                          {apiKey.keyPrefix}...
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            apiKey.isLive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {apiKey.isLive ? "Live" : "Test"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(apiKey.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {apiKey.lastUsedAt
                          ? new Date(apiKey.lastUsedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )
                          : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            isRevoked
                              ? "bg-red-500/10 text-red-400"
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {isRevoked ? "Revoked" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isRevoked && (
                          <>
                            {revokeConfirmId === apiKey.id ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleRevoke(apiKey.id)}
                                  disabled={isRevoking}
                                  className="rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                                >
                                  {isRevoking ? "Revoking..." : "Confirm"}
                                </button>
                                <button
                                  onClick={() => setRevokeConfirmId(null)}
                                  disabled={isRevoking}
                                  className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRevokeConfirmId(apiKey.id)}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Revoke key"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={newKey ? closeModal : undefined}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg mx-4">
            {newKey ? (
              /* Key created -- show the full key once */
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    API Key Created
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copy this key now. You will not be able to see it again.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-3">
                  <code className="text-xs font-mono text-foreground break-all">
                    {newKey}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                  <button
                    onClick={closeModal}
                    className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Create form */
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Create API Key
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Give your key a descriptive name
                  </p>
                </div>
                <form action={createAction} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="key-name"
                      className="block text-sm font-medium text-foreground"
                    >
                      Key Name
                    </label>
                    <input
                      id="key-name"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. Production Widget"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Mode
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isLive"
                          value="true"
                          defaultChecked
                          className="accent-primary"
                        />
                        <span className="text-sm text-foreground">Live</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isLive"
                          value="false"
                          className="accent-primary"
                        />
                        <span className="text-sm text-foreground">Test</span>
                      </label>
                    </div>
                  </div>

                  {createState?.error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                      {createState.error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Key className="h-4 w-4" />
                      {isCreating ? "Creating..." : "Create Key"}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isCreating}
                      className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
