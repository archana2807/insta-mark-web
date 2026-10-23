"use client";

import { useEffect, useRef } from "react";

// Subtle "depth" float, after the client's animation reference (the Synapse mosaic): one
// depth number per element sets how far it travels while the section scrolls past, so the
// photos read as near or far with no per-photo tuning. The movement follows the scroll with
// a smooth catch-up, and each element bobs a few pixels on its own while the page is still.
// One shared requestAnimationFrame loop runs only while an element is on screen.
const items = new Set();
let frame = 0;
let last = 0;

/** Frame-rate independent catch-up: feels the same at 60 and 144 Hz. */
const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

function tick(now) {
  const dt = Math.min(0.05, (now - (last || now)) / 1000);
  last = now;
  const t = now / 1000;
  const vh = window.innerHeight;
  let active = false;
  for (const item of items) {
    if (!item.visible) continue;
    active = true;
    const { el, depth, phase } = item;
    // Measure the untransformed box: subtract the offset applied last frame.
    const rect = el.getBoundingClientRect();
    const top = rect.top - item.y;
    // 0 when the element's top meets the viewport bottom, 1 when its bottom leaves the top.
    const progress = Math.min(1, Math.max(0, (vh - top) / (vh + rect.height)));
    // Near elements (low depth) travel further: about ±52 px near, ±28 px far.
    const travel = 40 + (1 - depth) * 80;
    const target = (0.5 - progress) * travel;
    item.y = item.fresh ? target : damp(item.y, target, 5, dt);
    item.fresh = false;
    // Idle float: a slow bob of 2–6 px, larger for far elements, each on its own beat.
    const bob = Math.sin(t * 0.5 + phase) * (2 + depth * 4);
    el.style.transform = `translate3d(0, ${(item.y + bob).toFixed(2)}px, 0)`;
  }
  frame = active ? window.requestAnimationFrame(tick) : 0;
  if (!active) last = 0;
}

function start() {
  if (!frame) frame = window.requestAnimationFrame(tick);
}

/**
 * Floats its content on scroll at a given depth (0 = near, moves most; 1 = far, moves
 * least) and lets it bob gently while the page is still. Off for prefers-reduced-motion.
 * @param {{ depth?: number, phase?: number, className?: string,
 *   children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export default function DepthFloat({ depth = 0.5, phase = 0, className = "", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const item = { el, depth, phase, y: 0, visible: false, fresh: true };
    items.add(item);
    el.style.willChange = "transform";
    const observer = new IntersectionObserver(
      ([entry]) => {
        item.visible = entry.isIntersecting;
        if (item.visible) start();
      },
      { rootMargin: "20% 0px" },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      items.delete(item);
      el.style.transform = "";
      el.style.willChange = "";
    };
  }, [depth, phase]);

  return (
    <div ref={ref} className={className || undefined}>
      {children}
    </div>
  );
}
