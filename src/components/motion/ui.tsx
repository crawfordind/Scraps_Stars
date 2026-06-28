"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { springSnappy } from "@/lib/motion/spring";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      // Tween, not spring — a velocity-driven spring can freeze near opacity:0
      // under mount-time load and leave content invisible.
      transition={{ duration: 0.28, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

type TabContentProps = {
  tabKey: string;
  children: ReactNode;
};

export function TabContent({ tabKey, children }: TabContentProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div key={tabKey}>{children}</div>;

  // Slide-only entrance — deliberately NO opacity keyframe.
  //
  // AppShell renders three separately-conditional <TabContent> children inside a
  // single <AnimatePresence mode="wait">. That's an AnimatePresence anti-pattern
  // (it expects keyed children), and under mount-time load the enter animation
  // can fail to fire — leaving the wrapper frozen at its `initial` values. If
  // `initial` hid the content (opacity:0), the whole tab rendered blank.
  //
  // By animating only `x`, the content is always opacity:1 and therefore always
  // visible; a stalled slide just leaves it ~20px off, which is imperceptible.
  return (
    <motion.div
      key={tabKey}
      initial={{ x: 20 }}
      animate={{ x: 0 }}
      exit={{ x: -16 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

type PhaseContentProps = {
  phaseKey: string;
  children: ReactNode;
  className?: string;
};

export function PhaseContent({ phaseKey, children, className }: PhaseContentProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        className={className}
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -32 }}
        // Tween (not spring) so the entrance can't stall at opacity:0 under load.
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type SpringButtonProps = ComponentPropsWithoutRef<"button">;

export function SpringButton({
  className,
  children,
  disabled,
  type = "button",
  onClick,
  "aria-label": ariaLabel,
}: SpringButtonProps) {
  const reduce = useReducedMotion();
  if (reduce || disabled) {
    return (
      <button
        type={type}
        className={className}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      className={className}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={springSnappy}
    >
      {children}
    </motion.button>
  );
}

type MotionLinkProps = Pick<
  ComponentPropsWithoutRef<typeof Link>,
  "className" | "children" | "href" | "prefetch" | "scroll" | "replace"
>;

export function MotionLink({ className, children, href, prefetch, scroll, replace }: MotionLinkProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <Link className={className} href={href} prefetch={prefetch} scroll={scroll} replace={replace}>
        {children}
      </Link>
    );
  }

  return (
    <Link className={className} href={href} prefetch={prefetch} scroll={scroll} replace={replace}>
      <motion.span
        style={{ display: "block" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={springSnappy}
      >
        {children}
      </motion.span>
    </Link>
  );
}

/** @deprecated Use MotionLink for Next.js routes */
export function SpringLink({ className, children, href, ...rest }: ComponentPropsWithoutRef<"a">) {
  return (
    <a className={className} href={href} {...rest}>
      {children}
    </a>
  );
}
