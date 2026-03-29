"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Globe,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type SourceType = "file" | "url" | "text";

interface AddSourceFormProps {
  onClose: () => void;
}

const TAB_OPTIONS: { value: SourceType; label: string; icon: React.ElementType }[] = [
  { value: "file", label: "Upload File", icon: Upload },
  { value: "url", label: "Web URL", icon: Globe },
  { value: "text", label: "Paste Text", icon: FileText },
];

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.txt,.md";

export function AddSourceForm({ onClose }: AddSourceFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SourceType>("file");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!name) {
        setName(selected.name.replace(/\.[^.]+$/, ""));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let response: Response;

      if (activeTab === "file") {
        if (!file) {
          setError("Please select a file to upload.");
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name || file.name);

        response = await fetch("/api/knowledge/ingest", {
          method: "POST",
          body: formData,
        });
      } else if (activeTab === "url") {
        if (!url.trim()) {
          setError("Please enter a URL.");
          setIsSubmitting(false);
          return;
        }

        response = await fetch("/api/knowledge/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name || url, url }),
        });
      } else {
        if (!text.trim()) {
          setError("Please paste some text content.");
          setIsSubmitting(false);
          return;
        }

        response = await fetch("/api/knowledge/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name || "Pasted text", text }),
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.error?.message ?? `Request failed with status ${response.status}`
        );
      }

      setSuccess(true);
      router.refresh();

      // Auto-close after brief success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Source Added</h3>
        <p className="text-sm text-muted-foreground">
          Your knowledge source is being processed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Source type tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveTab(tab.value);
              setError(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Name field */}
      <div>
        <label
          htmlFor="source-name"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Name
        </label>
        <input
          id="source-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Product Documentation"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {/* Tab-specific content */}
      {activeTab === "file" && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            File
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
          >
            {file ? (
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, TXT, or MD
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {activeTab === "url" && (
        <div>
          <label
            htmlFor="source-url"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            URL
          </label>
          <input
            id="source-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/help/getting-started"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            We will crawl this page and extract the text content.
          </p>
        </div>
      )}

      {activeTab === "text" && (
        <div>
          <label
            htmlFor="source-text"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Content
          </label>
          <textarea
            id="source-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste your knowledge base content here..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {text.length > 0
              ? `${text.length.toLocaleString()} characters`
              : "Paste FAQs, help articles, or product documentation"}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Add Source"
          )}
        </button>
      </div>
    </form>
  );
}
