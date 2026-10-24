"use client";

import { useEffect, useRef } from "react";

// One shared scroll/resize listener and animation frame for every drifting element.
const items = new Set();
let frame = 0;
let last = 0;

// Smooth follow, as in the Crafto reference (skrollr "smoothScrolling", about 200 ms): each
// element glides to the position its scroll progress asks for instead of jumping there, the
// same way when scrolling down or up. A time constant keeps it equal at 60 and 144 Hz.
const SMOOTH_MS = 70; // reaches 95 % of the way in about 200 ms

function update(now) {
  frame = 0;
  const dt = last ? Math.min(100, now - last) : 16;
  last = now;
  const follow = 1 - Math.exp(-dt / SMOOTH_MS);
  const vh = window.innerHeight;
  let moving = false;
  for (const item of items) {
    const { el, axis, from, to, scale } = item;
    // Measure the untransformed box: subtract the offset we applied last time.
    const rect = el.getBoundingClientRect();
    const top = rect.top - (axis === "y" ? item.current : 0);
    // 0 when the element's top meets the viewport bottom,
    // 1 when its bottom leaves the viewport top (theme "bottom-top" → "top-bottom").
    const progress = Math.min(1, Math.max(0, (vh - top) / (vh + rect.height)));
    const target = from + (to - from) * progress;
    // The first frame goes straight to the target, so nothing slides in on page load.
    const value = item.fresh ? target : item.current + (target - item.current) * follow;
    item.fresh = false;
    item.current = Math.abs(target - value) < 0.05 ? target : value;
    if (item.current !== target) moving = true;
    el.style.transform =
      axis === "x"
        ? `translate3d(${item.current.toFixed(2)}px, 0, 0)`
        : `translate3d(0, ${item.current.toFixed(2)}px, 0)${scale !== 1 ? ` scale(${scale})` : ""}`;
  }
  // Keep gliding until every element has arrived; then wait for the next scroll.
  if (moving) frame = window.requestAnimationFrame(update);
  else last = 0;
}

function requestUpdate() {
  if (!frame) frame = window.requestAnimationFrame(update);
}

/**
 * Moves its content a few pixels while the element scrolls through the
 * viewport (the Crafto services page's scroll drift): e.g. from -30 → 30 px
 * on y, or a big headline from -50 → 50 px on x. `scale` > 1 zooms the
 * content slightly so a drifting photo never shows its edges. It follows the scroll with
 * the reference's short smooth glide, the same way down and up.
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

    const item = { el, axis, from, to, scale, current: 0, fresh: true };
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
