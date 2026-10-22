"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/ClientIcon";
import ScrollDrift from "@/components/ui/ScrollDrift";

const INTERVAL_MS = 6000;
const DRAG_PX = 50; // how far a drag or swipe must go to change the slide

/** "1" → "01", as in the theme's "01 — 03" counter. */
const pad = (n) => String(n).padStart(2, "0");

/**
 * Home banner slider (Crafto "Branding Agency"): the photos change by dragging (or swiping)
 * and by themselves; a round "‹ DRAG ›" cursor follows the mouse over the photo. Nothing
 * else is shown (the client asked for no control bar and no counter, 22 Oct 2026).
 *  - Auto-play pauses while the mouse is over the photo and is off for prefers-reduced-motion.
 *  - Pause/play, previous and next buttons exist for keyboard and screen-reader users; they
 *    appear when focused (WCAG 2.1.1, 2.2.2).
 *  - With one slide there is no slider: the photo is simply shown.
 *  - Only the active slide is exposed to assistive technology.
 * @param {{ slides: import("react").ReactNode[], label?: string }} props
 * @returns {JSX.Element}
 */
export default function HeroSlider({ slides, label = "Featured work" }) {
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const cursorRef = useRef(null);
  const dragStart = useRef(null);

  // Reduced motion: no automatic change; the visitor can still press play.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || hovering || count < 2) return undefined;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, hovering, active, count]);

  const go = useCallback((delta) => setActive((i) => (i + delta + count) % count), [count]);

  // Drag (mouse) or swipe (touch): a long enough move changes the slide.
  const onPointerDown = (e) => {
    dragStart.current = e.clientX;
    cursorRef.current?.classList.add("is-dragging");
  };
  const endDrag = (e) => {
    cursorRef.current?.classList.remove("is-dragging");
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    if (dx <= -DRAG_PX) go(1);
    else if (dx >= DRAG_PX) go(-1);
  };
  // The round cursor follows the mouse only (not touch).
  const onPointerMove = (e) => {
    const cursor = cursorRef.current;
    if (!cursor || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    cursor.style.setProperty("--x", `${e.clientX - box.left}px`);
    cursor.style.setProperty("--y", `${e.clientY - box.top}px`);
  };
  const onPointerEnter = (e) => {
    if (e.pointerType !== "mouse") return;
    setHovering(true);
    onPointerMove(e);
    cursorRef.current?.classList.add("is-on");
  };
  const onPointerLeave = (e) => {
    setHovering(false);
    cursorRef.current?.classList.remove("is-on", "is-dragging");
    endDrag(e);
  };

  // The photos drift on scroll (and zoom a little).
  const drift = (children) => (
    <ScrollDrift className="drift-fill" from={-40} to={40} scale={1.08}>
      {children}
    </ScrollDrift>
  );

  if (count < 2) return drift(slides[0]);

  return (
    <div
      className="hero-slider"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {drift(
        <div className="hero-slider__slides" aria-live={playing ? "off" : "polite"}>
          {slides.map((slide, i) => (
            <div
              className={`hero-slider__slide ${i === active ? "is-active" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              inert={i !== active}
              data-slide={i}
              key={i}
            >
              {slide}
            </div>
          ))}
        </div>,
      )}

      {/* The round cursor (decorative). */}
      <div className="hero-slider__cursor" ref={cursorRef} aria-hidden="true">
        <span>‹ Drag ›</span>
      </div>

      {/* Keyboard and screen-reader controls: hidden until focused. */}
      <div className="hero-slider__keys">
        <button
          type="button"
          className="hero-slider__button"
          aria-label={playing ? "Pause the slideshow" : "Play the slideshow"}
          aria-pressed={!playing}
          onClick={() => setPlaying((p) => !p)}
        >
          <Icon name={playing ? "pause-fill" : "play-fill"} />
        </button>
        <button
          type="button"
          className="hero-slider__button"
          aria-label="Previous slide"
          onClick={() => go(-1)}
        >
          <Icon name="arrow-left" />
        </button>
        <button
          type="button"
          className="hero-slider__button"
          aria-label="Next slide"
          onClick={() => go(1)}
        >
          <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );
}
