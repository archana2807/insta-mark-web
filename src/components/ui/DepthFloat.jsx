"use client";

import { useEffect, useRef } from "react";

// Subtle layered float, after the client's animation reference (the Synapse mosaic): each
// element travels a set distance while its section scrolls past, up or down and sideways,
// so photos can move against each other and read as layers. The movement follows the
// scroll with a smooth catch-up, and each element floats a few pixels in a slow loop while
// the page is still. One shared requestAnimationFrame loop runs only while an element is
// on screen.
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
  // Sideways movement shrinks on narrow screens so it never widens the page.
  const xScale = Math.min(1, window.innerWidth / 1200);
  let active = false;
  for (const item of items) {
    if (!item.visible) continue;
    active = true;
    const { el, travelX, travelY, bob, phase } = item;
    // Measure the untransformed box: subtract the offset applied last frame.
    const rect = el.getBoundingClientRect();
    const top = rect.top - item.y - item.bobY;
    // 0 when the element's top meets the viewport bottom, 1 when its bottom leaves the top.
    const progress = Math.min(1, Math.max(0, (vh - top) / (vh + rect.height)));
    // +half the travel on the way in, -half on the way out (a negative travel reverses it).
    const s = 0.5 - progress;
    const targetX = s * travelX * xScale;
    const targetY = s * travelY;
    item.x = item.fresh ? targetX : damp(item.x, targetX, 4, dt);
    item.y = item.fresh ? targetY : damp(item.y, targetY, 4, dt);
    item.fresh = false;
    // Idle float: a slow loop, `bob` px up and down and 60 % of that sideways.
    const a = t * 0.6 + phase;
    item.bobY = Math.sin(a) * bob;
    const bobX = Math.cos(a) * bob * 0.6 * xScale;
    el.style.transform = `translate3d(${(item.x + bobX).toFixed(2)}px, ${(item.y + item.bobY).toFixed(2)}px, 0)`;
  }
  frame = active ? window.requestAnimationFrame(tick) : 0;
  if (!active) last = 0;
}

function start() {
  if (!frame) frame = window.requestAnimationFrame(tick);
}

/**
 * Floats its content while it scrolls past: `travelY` / `travelX` px in total (a negative
 * value moves the other way), plus a slow idle float of `bob` px. Off for
 * prefers-reduced-motion.
 * @param {{ travelX?: number, travelY?: number, bob?: number, phase?: number,
 *   className?: string, children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export default function DepthFloat({
  travelX = 0,
  travelY = 80,
  bob = 4,
  phase = 0,
  className = "",
  children,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const item = {
      el,
      travelX,
      travelY,
      bob,
      phase,
      x: 0,
      y: 0,
      bobY: 0,
      visible: false,
      fresh: true,
    };
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
  }, [travelX, travelY, bob, phase]);

  return (
    <div ref={ref} className={className || undefined}>
      {children}
    </div>
  );
}
