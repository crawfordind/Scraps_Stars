"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShareContent } from "@/lib/share/shareContent";

type ShareButtonProps = {
  content?: ShareContent;
  getContent?: () => ShareContent;
  label?: string;
  className?: string;
  compact?: boolean;
};

function formatClipboardText(payload: ShareContent): string {
  const parts = [payload.title, "", payload.text];
  if (payload.url) {
    parts.push("", payload.url);
  }
  return parts.join("\n");
}

export function ShareButton({
  content,
  getContent,
  label = "Share",
  className = "",
  compact = false,
}: ShareButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setFeedback(null), 2200);
  }, []);

  const resolveContent = useCallback((): ShareContent => {
    if (getContent) return getContent();
    if (content) return content;
    throw new Error("ShareButton requires content or getContent");
  }, [content, getContent]);

  const copyToClipboard = useCallback(
    async (payload: ShareContent) => {
      await navigator.clipboard.writeText(formatClipboardText(payload));
      showFeedback("Copied");
    },
    [showFeedback],
  );

  const handleShare = useCallback(async () => {
    const payload = resolveContent();

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        showFeedback("Shared");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await copyToClipboard(payload);
    } catch {
      showFeedback("Couldn't copy");
    }
  }, [copyToClipboard, resolveContent, showFeedback]);

  const classes = ["share-btn", compact && "share-btn--compact", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      onClick={() => void handleShare()}
      aria-label={feedback ? feedback : label}
    >
      <span className="share-btn__icon" aria-hidden>
        ↗
      </span>
      <span className="share-btn__label">{feedback ?? label}</span>
    </button>
  );
}
