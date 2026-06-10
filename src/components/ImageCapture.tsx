"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraViewfinder } from "./CameraViewfinder";
import { useDeviceCapabilities } from "@/hooks/useDeviceCapabilities";

type ImageCaptureProps = {
  onCapture: (file: File) => void;
  disabled?: boolean;
  previewUrl?: string | null;
  scanning?: boolean;
};

// Accept anything the browser tags as an image; also rescue files that arrive
// with an empty MIME type (common for HEIC) by sniffing the extension, so a
// real photo is never silently rejected.
function looksLikeImage(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|hei[cf]|bmp|avif)$/i.test(file.name);
}

export function ImageCapture({ onCapture, disabled, previewUrl, scanning }: ImageCaptureProps) {
  const caps = useDeviceCapabilities();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (disabled) return;
      setError(null);
      if (!file) return;
      // Foolproof: tell people exactly why a file didn't work instead of
      // silently doing nothing.
      if (!looksLikeImage(file)) {
        setError("That doesn't look like a photo. Try a JPG, PNG, or WebP image of your fridge.");
        return;
      }
      onCapture(file);
    },
    [disabled, onCapture],
  );

  // Activation win: let people who can't (or won't) photograph their fridge
  // experience the whole scan → recipe magic in one tap with a bundled photo.
  const trySample = useCallback(async () => {
    if (disabled || loadingSample) return;
    try {
      setLoadingSample(true);
      const res = await fetch("/sample-fridge.jpg");
      if (!res.ok) throw new Error("sample unavailable");
      const blob = await res.blob();
      handleFile(new File([blob], "sample-fridge.jpg", { type: blob.type || "image/jpeg" }));
    } catch {
      setLoadingSample(false);
    }
  }, [disabled, loadingSample, handleFile]);

  const openCamera = () => {
    if (caps.isMobile || caps.isIOS) {
      cameraInputRef.current?.click();
      return;
    }
    if (caps.hasWebcam) {
      setShowWebcam(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const openGallery = () => {
    galleryInputRef.current?.click();
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (disabled) return;
      const item = Array.from(event.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (!item) return;
      const file = item.getAsFile();
      if (file) {
        event.preventDefault();
        handleFile(file);
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [disabled, handleFile]);

  useEffect(() => {
    if (caps.isTouch) return;
    const timer = window.setTimeout(() => setPasteHint(true), 1200);
    return () => window.clearTimeout(timer);
  }, [caps.isTouch]);

  return (
    <section className="capture">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="capture__hidden-input"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="capture__hidden-input"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="capture__hidden-input"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="capture__error" role="alert">
          {error}
        </p>
      )}

      {previewUrl ? (
        <div className="capture__preview-card">
          <div className="capture__preview-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Kitchen preview" />
            {scanning && (
              <div className="capture__scan-overlay" aria-live="polite">
                <div className="capture__scan-pulse" />
                <p>Analyzing your kitchen…</p>
              </div>
            )}
          </div>
          <div className="capture__preview-actions">
            <button type="button" className="capture__action capture__action--secondary" disabled={disabled || scanning} onClick={openCamera}>
              Retake
            </button>
            <button type="button" className="capture__action capture__action--secondary" disabled={disabled || scanning} onClick={openGallery}>
              Pick another
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`capture__dropzone ${dragActive ? "capture__dropzone--active" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
            setError(null);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <div className="capture__dropzone-inner">
            <div className="capture__icon-ring" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 7h4l2-3h4l2 3h4v12H4V7z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </div>
            <h2>Show me the sad shelf</h2>
            <p>Open the fridge, pantry, or spice rack. Works on phone, tablet, and desktop.</p>

            <div className="capture__actions">
              <button type="button" className="capture__action capture__action--primary" disabled={disabled} onClick={openCamera}>
                <span className="capture__action-icon" aria-hidden>📷</span>
                <span>
                  <strong>{caps.isMobile ? "Take Photo" : "Use Camera"}</strong>
                  <small>{caps.isMobile ? "Opens your device camera" : "Live webcam capture"}</small>
                </span>
              </button>

              <button type="button" className="capture__action" disabled={disabled} onClick={openGallery}>
                <span className="capture__action-icon" aria-hidden>🖼️</span>
                <span>
                  <strong>Choose from Gallery</strong>
                  <small>Pick an existing photo</small>
                </span>
              </button>

              {!caps.isMobile && (
                <button type="button" className="capture__action" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
                  <span className="capture__action-icon" aria-hidden>📁</span>
                  <span>
                    <strong>Browse Files</strong>
                    <small>Or drag & drop anywhere here</small>
                  </span>
                </button>
              )}
            </div>

            <p className="capture__formats">JPG, PNG, WebP or HEIC · up to 8MB</p>

            <button
              type="button"
              className="capture__sample"
              disabled={disabled || loadingSample}
              onClick={() => void trySample()}
            >
              {loadingSample ? "Loading a sample fridge…" : "✨ No fridge handy? Try a sample fridge"}
            </button>

            {pasteHint && !caps.isTouch && (
              <p className="capture__hint">Tip: paste an image with Ctrl+V / ⌘V</p>
            )}
          </div>
        </div>
      )}

      {showWebcam && (
        <CameraViewfinder
          onCapture={(file) => {
            setShowWebcam(false);
            handleFile(file);
          }}
          onClose={() => setShowWebcam(false)}
          onPickInstead={() => {
            setShowWebcam(false);
            openGallery();
          }}
        />
      )}
    </section>
  );
}
