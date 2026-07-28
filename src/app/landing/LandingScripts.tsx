"use client";

import { useEffect } from "react";

/**
 * Progressive-enhancement island for the landing page.
 * - Adds `.js-ready` to the .landing root so reveal styles only apply when JS runs
 *   (without JS, all content stays fully visible).
 * - Reveals [data-reveal] elements once as they scroll into view.
 * - Shows the mobile sticky CTA bar only after the hero scrolls out of view.
 * All motion is skipped when the user prefers reduced motion.
 */
export function LandingScripts() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("js-ready");

    const revealEls = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    let revealObserver: IntersectionObserver | undefined;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      revealEls.forEach((el) => el.classList.add("is-in"));
    } else {
      revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              revealObserver?.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
      );
      revealEls.forEach((el) => revealObserver?.observe(el));
    }

    // Mobile sticky CTA: visible only once the hero is out of view.
    const hero = document.getElementById("hero");
    const mobileCta = document.getElementById("lp-mobilecta");
    let heroObserver: IntersectionObserver | undefined;

    if (hero && mobileCta && typeof IntersectionObserver !== "undefined") {
      heroObserver = new IntersectionObserver(
        (entries) => {
          const heroVisible = entries[0]?.isIntersecting ?? false;
          mobileCta.classList.toggle("is-visible", !heroVisible);
        },
        { threshold: 0 },
      );
      heroObserver.observe(hero);
    }

    return () => {
      revealObserver?.disconnect();
      heroObserver?.disconnect();
    };
  }, []);

  return null;
}
