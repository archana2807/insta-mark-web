"use client";

import { useEffect, useRef } from "react";

// One shared, rAF-throttled scroll/resize listener for every drifting element.
const items = new Set();
let ticking = false;

function update() {
  ticking = false;
  const vh = window.innerHeight;
  for (const item of items) {
    const { el, axis, from, to, scale } = item;
    // Measure the untransformed box: subtract the offset we applied last time.
    const rect = el.getBoundingClientRect();
    const top = rect.top - (axis === "y" ? item.current : 0);
    // 0 when the element's top meets the viewport bottom,
    // 1 when its bottom leaves the viewport top (theme "bottom-top" → "top-bottom").
    const progress = Math.min(1, Math.max(0, (vh - top) / (vh + rect.height)));
    const value = from + (to - from) * progress;
    item.current = value;
    el.style.transform =
      axis === "x"
        ? `translate3d(${value.toFixed(1)}px, 0, 0)`
        : `translate3d(0, ${value.toFixed(1)}px, 0)${scale !== 1 ? ` scale(${scale})` : ""}`;
  }
}

function requestUpdate() {
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(update);
  }
}

/**
 * Moves its content a few pixels while the element scrolls through the
 * viewport (the Crafto services page's scroll drift): e.g. from -30 → 30 px
 * on y, or a big headline from -50 → 50 px on x. `scale` > 1 zooms the
 * content slightly so a drifting photo never shows its edges.
 * Disabled for prefers-reduced-motion.
 */
export default function ScrollDrift({
  as: Tag = "div",
  axis = "y",
  from = -30,
  to = 30,
  scale = 1,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const item = { el, axis, from, to, scale, current: 0 };
    items.add(item);
    if (items.size === 1) {
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate);
    }
    el.style.willChange = "transform";
    requestUpdate();

    return () => {
      items.delete(item);
      el.style.transform = "";
      el.style.willChange = "";
      if (items.size === 0) {
        window.removeEventListener("scroll", requestUpdate);
        window.removeEventListener("resize", requestUpdate);
      }
    };
  }, [axis, from, to, scale]);

  return (
    <Tag ref={ref} className={className || undefined} {...rest}>
      {children}
    </Tag>
  );
}
