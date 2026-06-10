"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraViewfinderProps = {
  onCapture: (file: File) => void;
  onClose: () => void;
  onPickInstead?: () => void;
};

// Turn raw getUserMedia/DOMException names into plain, actionable guidance.
function describeCameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access is blocked. Allow the camera from your browser's address bar, then tap Try again — or just pick a photo instead.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "We couldn't find a camera on this device. Pick a photo instead.";
    case "NotReadableError":
    case "AbortError":
      return "Your camera looks busy in another app or tab. Close it, then tap Try again.";
    default:
      return "We couldn't start the camera. Tap Try again, or pick a photo instead.";
  }
}

export function CameraViewfinder({ onCapture, onClose, onPickInstead }: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async (targetDeviceId?: string) => {
    stopStream();
    setReady(false);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setReady(true);
    } catch (err) {
      setError(describeCameraError(err));
    }
  }, [stopStream]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const cameras = all.filter((d) => d.kind === "videoinput");
        if (!cancelled) {
          setDevices(cameras);
          const back = cameras.find((d) => /back|rear|environment/i.test(d.label));
          const initial = back?.deviceId ?? cameras[0]?.deviceId;
          setDeviceId(initial);
          await startStream(initial);
        }
      } catch (err) {
        if (!cancelled) {
          setError(describeCameraError(err));
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [startStream, stopStream]);

  const switchCamera = async () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(idx + 1) % devices.length];
    setDeviceId(next.deviceId);
    await startStream(next.deviceId);
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    // Brief shutter flash so the capture feels deliberate and confirmed before
    // the viewfinder hands the photo off and closes.
    setFlash(true);
    window.setTimeout(() => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setFlash(false);
            return;
          }
          stopStream();
          onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.88,
      );
    }, 110);
  };

  return (
    <div className="viewfinder-overlay" role="dialog" aria-modal="true" aria-label="Camera capture">
      <div className="viewfinder">
        <header className="viewfinder__header">
          <button type="button" className="viewfinder__icon-btn" onClick={onClose} aria-label="Close camera">
            ✕
          </button>
          <span>Take a photo</span>
          {devices.length > 1 ? (
            <button type="button" className="viewfinder__icon-btn" onClick={() => void switchCamera()} aria-label="Switch camera">
              ⟳
            </button>
          ) : (
            <span className="viewfinder__spacer" />
          )}
        </header>

        <div className="viewfinder__stage">
          {error ? (
            <div className="viewfinder__error" role="alert">
              <p className="viewfinder__error-msg">{error}</p>
              <div className="viewfinder__error-actions">
                <button type="button" className="viewfinder__error-btn" onClick={() => void startStream(deviceId)}>
                  Try again
                </button>
                {onPickInstead && (
                  <button type="button" className="viewfinder__error-btn viewfinder__error-btn--primary" onClick={onPickInstead}>
                    Choose a photo instead
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="viewfinder__video" playsInline muted autoPlay />
              {!ready && (
                <div className="viewfinder__status" aria-live="polite">
                  <span className="viewfinder__spinner" aria-hidden />
                  <p>Starting camera…</p>
                </div>
              )}
              <div className="viewfinder__frame" aria-hidden />
              {flash && <div className="viewfinder__flash" aria-hidden />}
            </>
          )}
        </div>

        <footer className="viewfinder__footer">
          <button type="button" className="viewfinder__shutter" onClick={capture} disabled={!ready || !!error} aria-label="Capture photo">
            <span />
          </button>
        </footer>
      </div>
    </div>
  );
}
