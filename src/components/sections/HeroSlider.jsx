"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/ClientIcon";
import ScrollDrift from "@/components/ui/ScrollDrift";

const INTERVAL_MS = 6000;

/** "1" → "01", as in the theme's "01 — 03" counter. */
const pad = (n) => String(n).padStart(2, "0");

/**
 * Home banner slider (Crafto "Branding Agency": photos change with a "01 — 03" counter).
 * The slides are rendered on the server and passed in; this component only switches them.
 *  - Auto-play has a pause/play button (WCAG 2.2.2) and is off for prefers-reduced-motion.
 *  - With one slide there is no slider and no controls: the photo is simply shown.
 *  - Only the active slide is exposed to assistive technology.
 * @param {{ slides: import("react").ReactNode[], label?: string }} props
 * @returns {JSX.Element}
 */
export default function HeroSlider({ slides, label = "Featured work" }) {
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Reduced motion: no automatic change; the visitor can still press play.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || count < 2) return undefined;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, active, count]);

  const go = useCallback((delta) => setActive((i) => (i + delta + count) % count), [count]);

  // The photos drift on scroll (and zoom a little); the controls must stay put, so they
  // are outside the drifting layer.
  const drift = (children) => (
    <ScrollDrift className="drift-fill" from={-40} to={40} scale={1.08}>
      {children}
    </ScrollDrift>
  );

  if (count < 2) return drift(slides[0]);

  return (
    <div className="hero-slider" role="group" aria-roledescription="carousel" aria-label={label}>
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

      <div className="hero-slider__controls">
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
        <span className="hero-slider__count" aria-hidden="true">
          {pad(active + 1)}
        </span>
        <span className="hero-slider__line" aria-hidden="true">
          <span
            className={`hero-slider__line-fill ${playing ? "is-running" : ""}`}
            style={{ "--interval": `${INTERVAL_MS}ms` }}
            key={`${active}-${playing}`}
          />
        </span>
        <span className="hero-slider__count" aria-hidden="true">
          {pad(count)}
        </span>
        <button
          type="button"
          className="hero-slider__button"
          aria-label="Next slide"
          onClick={() => go(1)}
        >
          <Icon name="arrow-right" />
        </button>
        <span className="visually-hidden" aria-live="polite">
          Slide {active + 1} of {count}
        </span>
      </div>
    </div>
  );
}
