"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll entrance animation, modelled on the Crafto "Branding Agency" demo
 * (own implementation, no animation library):
 *
 *   effect  "up" (30px rise, default) · "left" (30px slide) · "flip" (rise +
 *           3D tilt, for tile grids) · "fade" · "wipe" (a light panel slides
 *           off an image, left → right)
 *   stagger ms between direct children (theme "childs" mode); 0 = animate
 *           the element as a whole
 *   delay   ms before the first item starts
 *   always  also animate when the element is already on screen at load (for a row right
 *           under the banner whose counters must always roll); off by default
 *
 * Only elements that are still below the fold when JS runs are hidden first,
 * so above-the-fold content never flickers and nothing is hidden without JS.
 * prefers-reduced-motion turns all of it off (see styles/_motion.scss).
 */
export default function Reveal({
  as: Tag = "div",
  effect = "up",
  stagger = 0,
  delay = 0,
  always = false,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!always && el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    const items = stagger ? [...el.children] : [el];
    items.forEach((item, i) => {
      item.style.transitionDelay = `${delay + i * stagger}ms`;
      // The same delay for nested parts that run their own transition (e.g. rolling digits).
      item.style.setProperty("--reveal-delay", `${delay + i * stagger}ms`);
    });
    el.classList.add("motion-armed");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // Two frames later, so the hidden state has been painted and the change animates.
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => el.classList.remove("motion-armed")),
        );
        // Clear delays afterwards so hover transitions aren't delayed.
        const total = delay + items.length * stagger + 1200;
        window.setTimeout(() => items.forEach((item) => (item.style.transitionDelay = "")), total);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [always, delay, stagger]);

  const classes = ["motion", `motion-${effect}`, stagger ? "motion-stagger" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref} className={classes} {...rest}>
      {children}
    </Tag>
  );
}
