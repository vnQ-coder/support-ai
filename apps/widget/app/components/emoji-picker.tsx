"use client";
import { useState, useRef, useEffect } from "react";

const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😂", "🥹", "😊", "😍", "🤔", "😅", "😢", "😡", "🥳", "😴", "🤗"],
  "Hands": ["👍", "👎", "👋", "🙏", "👏", "🤝", "✌️", "🤞", "💪", "☝️", "✋", "🫶"],
  "Objects": ["❤️", "🔥", "⭐", "✅", "❌", "⚠️", "💡", "📎", "🎉", "💬", "📧", "🔗"],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-border bg-card p-2 shadow-lg">
      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
        <div key={category} className="mb-2">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{category}</p>
          <div className="grid grid-cols-6 gap-1">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onSelect(emoji); onClose(); }}
                className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
