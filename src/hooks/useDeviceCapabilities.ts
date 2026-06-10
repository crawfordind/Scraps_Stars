"use client";

import { useEffect, useState } from "react";

export type DeviceCapabilities = {
  isTouch: boolean;
  isMobile: boolean;
  isIOS: boolean;
  hasWebcam: boolean;
  prefersReducedMotion: boolean;
};

const MOBILE_RE = /Android|iPhone|iPad|iPod|Mobile/i;

export function useDeviceCapabilities(): DeviceCapabilities {
  const [caps, setCaps] = useState<DeviceCapabilities>({
    isTouch: false,
    isMobile: false,
    isIOS: false,
    hasWebcam: false,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isMobile = MOBILE_RE.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    setCaps({
      isTouch,
      isMobile,
      isIOS,
      hasWebcam: Boolean(navigator.mediaDevices?.getUserMedia),
      prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, []);

  return caps;
}
