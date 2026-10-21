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
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    const items = stagger ? [...el.children] : [el];
    items.forEach((item, i) => {
      item.style.transitionDelay = `${delay + i * stagger}ms`;
    });
    el.classList.add("motion-armed");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.remove("motion-armed");
        observer.disconnect();
        // Clear delays afterwards so hover transitions aren't delayed.
        const total = delay + items.length * stagger + 1200;
        window.setTimeout(() => items.forEach((item) => (item.style.transitionDelay = "")), total);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, stagger]);

  const classes = ["motion", `motion-${effect}`, stagger ? "motion-stagger" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref} className={classes} {...rest}>
      {children}
    </Tag>
  );
}
