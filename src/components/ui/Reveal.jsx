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
 * The animation plays every time the element comes into view, scrolling down or up (client,
 * 24 Oct 2026): once it has left the screen completely, it is reset without a transition,
 * so the reset is never seen, and it plays again on the way back.
 * Elements on screen when JS runs are not hidden first, so the first screen never flickers,
 * and nothing is hidden without JS. prefers-reduced-motion turns all of it off (see
 * styles/_motion.scss).
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
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const items = () => (stagger ? [...el.children] : [el]);
    let clearTimer = 0;

    // Hidden state, set off screen and without a transition, ready for the next entrance.
    const reset = () => {
      el.classList.add("motion-reset", "motion-armed");
      void el.offsetWidth; // apply the hidden state before transitions come back
      el.classList.remove("motion-reset");
    };

    // Entrance: stagger delays on, then the hidden state goes two frames later (so it has
    // been painted and the change animates); the delays go again afterwards, so hover
    // transitions are not delayed.
    const play = () => {
      const list = items();
      list.forEach((item, i) => {
        item.style.transitionDelay = `${delay + i * stagger}ms`;
        // The same delay for nested parts that run their own transition (e.g. rolling digits).
        item.style.setProperty("--reveal-delay", `${delay + i * stagger}ms`);
      });
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => el.classList.remove("motion-armed")),
      );
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(
        () => list.forEach((item) => (item.style.transitionDelay = "")),
        delay + list.length * stagger + 1200,
      );
    };

    const onScreenAtLoad = el.getBoundingClientRect().top < window.innerHeight * 0.92;
    if (always || !onScreenAtLoad) reset();

    // Plays when the element is well inside the view (8 % above the bottom edge) …
    const enter = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && el.classList.contains("motion-armed")) play();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    // … and is reset only once no part of it is on screen any more, so nothing flickers at
    // the edges of the view.
    const leave = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !el.classList.contains("motion-armed")) reset();
    });
    enter.observe(el);
    leave.observe(el);
    return () => {
      enter.disconnect();
      leave.disconnect();
      window.clearTimeout(clearTimer);
    };
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
