"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShareContent } from "@/lib/share/shareContent";
import { DEFAULT_SHARE_CAPTION, recipePermalink, shareCardUrl } from "@/lib/share/shareId";

type PrescriptionShareButtonProps = {
  shareId: string;
  content?: ShareContent;
  getContent?: () => ShareContent;
  label?: string;
  className?: string;
  compact?: boolean;
};

function formatClipboardText(payload: ShareContent): string {
  const parts = [payload.title, "", payload.text];
  if (payload.url) parts.push("", payload.url);
  return parts.join("\n");
}

export function PrescriptionShareButton({
  shareId,
  content,
  getContent,
  label = "Share recipe card",
  className = "",
  compact = false,
}: PrescriptionShareButtonProps) {
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
    const permalink = recipePermalink(shareId);
    if (getContent) {
      const base = getContent();
      return { ...base, url: permalink, text: `${DEFAULT_SHARE_CAPTION}${base.text}` };
    }
    if (content) {
      return { ...content, url: permalink, text: `${DEFAULT_SHARE_CAPTION}${content.text}` };
    }
    return {
      title: "Recipe share card",
      text: DEFAULT_SHARE_CAPTION,
      url: permalink,
    };
  }, [content, getContent, shareId]);

  const handleShare = useCallback(async () => {
    const payload = resolveContent();
    const cardUrl = shareCardUrl(shareId);

    try {
      const cardRes = await fetch(cardUrl);
      if (!cardRes.ok) throw new Error("Card fetch failed");
      const blob = await cardRes.blob();
      const file = new File([blob], `recipe-${shareId}.png`, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
          files: [file],
        });
        showFeedback("Shared");
        return;
      }

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
        showFeedback("Shared");
        return;
      }

      await navigator.clipboard.writeText(formatClipboardText(payload));
      window.open(cardUrl, "_blank", "noopener,noreferrer");
      showFeedback("Copied link");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(formatClipboardText(payload));
        window.open(cardUrl, "_blank", "noopener,noreferrer");
        showFeedback("Copied link");
      } catch {
        showFeedback("Couldn't share");
      }
    }
  }, [resolveContent, shareId, showFeedback]);

  const classes = ["share-btn", compact && "share-btn--compact", className].filter(Boolean).join(" ");

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
