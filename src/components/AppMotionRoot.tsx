"use client";

import { MotionProvider } from "@/components/motion/MotionProvider";
import { ToastProvider } from "@/components/feedback/ToastProvider";

export function AppMotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <ToastProvider>{children}</ToastProvider>
    </MotionProvider>
  );
}
