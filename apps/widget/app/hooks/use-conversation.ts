"use client";

import { useState, useEffect, useCallback } from "react";

interface ConversationState {
  conversationId: string | null;
  contactInfo: { name?: string; email: string } | null;
  existingMessages: Array<{ role: string; content: string; createdAt: string }>;
  isRestoring: boolean;
}

export function useConversation(orgId: string, apiBaseUrl: string) {
  const storageKey = `supportai_conversation_${orgId}`;
  const [state, setState] = useState<ConversationState>({
    conversationId: null,
    contactInfo: null,
    existingMessages: [],
    isRestoring: true,
  });

  // On mount: check localStorage for existing conversation
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { conversationId, contactInfo } = JSON.parse(saved);
        setState((prev) => ({
          ...prev,
          conversationId,
          contactInfo,
          isRestoring: true,
        }));
        // TODO: fetch message history from API (when endpoint exists)
        // For now just restore the IDs
        setState((prev) => ({ ...prev, isRestoring: false }));
      } else {
        setState((prev) => ({ ...prev, isRestoring: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, isRestoring: false }));
    }
  }, [storageKey]);

  const createConversation = useCallback(
    async (contactInfo: { name?: string; email: string }) => {
      try {
        // Store contact info and mark as ready
        const conversationId = crypto.randomUUID();
        const data = { conversationId, contactInfo };
        localStorage.setItem(storageKey, JSON.stringify(data));
        setState((prev) => ({ ...prev, conversationId, contactInfo }));
        return conversationId;
      } catch {
        // If localStorage fails, still allow chat with a temp ID
        const tempId = crypto.randomUUID();
        setState((prev) => ({ ...prev, conversationId: tempId, contactInfo }));
        return tempId;
      }
    },
    [storageKey]
  );

  const clearConversation = useCallback(() => {
    localStorage.removeItem(storageKey);
    setState({
      conversationId: null,
      contactInfo: null,
      existingMessages: [],
      isRestoring: false,
    });
  }, [storageKey]);

  return { ...state, createConversation, clearConversation };
}
