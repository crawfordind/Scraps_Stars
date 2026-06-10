"use client";

import { useState } from "react";
import { ImageCapture } from "../ImageCapture";
import { FadeIn, SpringButton } from "@/components/motion/ui";

type VerdictPanelProps = {
  recipeName: string;
  onNailedIt: (photoFile?: File) => Promise<void>;
  onTweakIt: (gripe: string) => Promise<void>;
  loading?: boolean;
};

export function VerdictPanel({ recipeName, onNailedIt, onTweakIt, loading }: VerdictPanelProps) {
  const [mode, setMode] = useState<"choose" | "photo" | "tweak">("choose");
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gripe, setGripe] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCapture = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <FadeIn>
      <section className="panel verdict-panel" aria-live="polite">
        <p className="verdict-panel__eyebrow">Final step</p>
        <h2>How did {recipeName} turn out?</h2>

        {mode === "choose" && (
          <div className="verdict-panel__choices">
            <SpringButton type="button" className="primary-btn verdict-panel__btn" onClick={() => setMode("photo")}>
              Nailed It ✓
            </SpringButton>
            <SpringButton
              type="button"
              className="secondary-btn verdict-panel__btn"
              onClick={() => setMode("tweak")}
              disabled={loading}
            >
              Tweak It
            </SpringButton>
          </div>
        )}

        {mode === "photo" && (
          <div className="verdict-panel__photo">
            <p>Optional plated photo — show off your finished recipe on the share card.</p>
            <ImageCapture onCapture={handleCapture} previewUrl={photoPreview} />
            <div className="verdict-panel__choices">
              <SpringButton
                type="button"
                className="primary-btn"
                disabled={submitting}
                onClick={() => {
                  setSubmitting(true);
                  void onNailedIt(photoFile).finally(() => setSubmitting(false));
                }}
              >
                {submitting ? "Saving…" : "Finish & share recipe"}
              </SpringButton>
              <button
                type="button"
                className="panel__link"
                disabled={submitting}
                onClick={() => {
                  setSubmitting(true);
                  void onNailedIt().finally(() => setSubmitting(false));
                }}
              >
                Skip photo
              </button>
            </div>
          </div>
        )}

        {mode === "tweak" && (
          <div className="verdict-panel__tweak">
            <label htmlFor="tweak-gripe">What should we fix?</label>
            <textarea
              id="tweak-gripe"
              rows={3}
              value={gripe}
              onChange={(e) => setGripe(e.target.value)}
              placeholder="Too salty, needed more time, etc."
            />
            <SpringButton
              type="button"
              className="primary-btn"
              disabled={loading || gripe.trim().length < 3}
              onClick={() => void onTweakIt(gripe.trim())}
            >
              {loading ? "Revising…" : "Revise recipe & re-cook"}
            </SpringButton>
          </div>
        )}
      </section>
    </FadeIn>
  );
}
