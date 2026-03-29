"use client";
import { useState, useRef, useEffect } from "react";
import { Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";

interface AttachmentButtonProps {
  apiBaseUrl: string;
  onAttach: (attachment: { url: string; type: string; name: string }) => void;
  disabled?: boolean;
}

interface AttachmentPreview {
  file: File;
  previewUrl?: string;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif,image/webp,application/pdf";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function AttachmentButton({ apiBaseUrl, onAttach, disabled }: AttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<AttachmentPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke Object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
    };
  }, [preview?.previewUrl]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_SIZE) {
      setError("File must be under 5MB");
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setPreview({ file, previewUrl });
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", preview.file);

      const res = await fetch(`${apiBaseUrl}/api/v1/widget/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      onAttach({ url: data.url, type: data.type, name: data.name });
      clearPreview();
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleSelect}
        className="hidden"
      />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
        title="Attach file"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      {/* Preview overlay */}
      {preview && (
        <div className="absolute bottom-full left-0 mb-2 flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-lg">
          {preview.previewUrl ? (
            <img src={preview.previewUrl} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium">{preview.file.name}</p>
            <p className="text-[10px] text-muted-foreground">{(preview.file.size / 1024).toFixed(0)} KB</p>
          </div>
          <div className="flex gap-1">
            <button onClick={handleUpload} disabled={uploading} className="rounded bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {uploading ? "..." : "Send"}
            </button>
            <button onClick={clearPreview} className="rounded p-1 hover:bg-accent">
              <X className="h-3 w-3" />
            </button>
          </div>
          {error && <p className="absolute -bottom-5 left-0 text-[10px] text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
