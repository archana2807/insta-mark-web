"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/ClientIcon";

const DRAG_PX = 50; // how far a drag or swipe must go to change the card
const INTERVAL_MS = 4000; // auto-slide: the next card comes forward every 4 s

/**
 * Where a card sits relative to the active one: 0 = front, ±1 = beside it, … The cards wrap
 * round, so with five cards the last one sits left of the first.
 * @param {number} i
 * @param {number} active
 * @param {number} count
 * @returns {number}
 */
function offsetOf(i, active, count) {
  let d = i - active;
  if (d > count / 2) d -= count;
  if (d < -count / 2) d += count;
  return d;
}

/**
 * Layered card carousel (client, 23 Oct 2026; replaces the About page photo collage): the
 * active card stands in front, the others step back and shrink on both sides. The arrows,
 * a drag or swipe, or the keyboard arrow keys bring the next card forward; the cards slide
 * and scale smoothly (no movement with prefers-reduced-motion).
 *  - Auto-slide (client, 24 Oct 2026): the next card every 4 s. It waits while the mouse is
 *    over the carousel, while it is off screen and while the tab is hidden; a manual change
 *    starts the 4 s again. A visible pause/play button stops it (WCAG 2.2.2). It does not
 *    start by itself for prefers-reduced-motion.
 *  - Each card shows its label on top; the front card links to `href`; a click on a side
 *    card brings it to the front.
 *  - Only the front card is exposed to assistive technology; the change is announced.
 * @param {{ items: { src: string, alt: string, label: string, href: string }[],
 *   label?: string }} props
 * @returns {JSX.Element}
 */
export default function LayerCarousel({ items, label = "Our work" }) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const dragStart = useRef(null);
  const go = useCallback((delta) => setActive((i) => (i + delta + count) % count), [count]);
  const rootRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  // Reduced motion: no automatic change; the visitor can still press play.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  // Only play while the carousel is on screen and the tab is visible.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // One timer per card: a manual change (new `active`) starts the 4 s again.
  useEffect(() => {
    if (!playing || hovering || !inView || !tabVisible || count < 2) return undefined;
    const timer = window.setTimeout(() => go(1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, hovering, inView, tabVisible, active, count, go]);

  // Arrow keys move the cards while focus is inside the carousel.
  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else return;
    e.preventDefault();
  };

  // A drag or swipe changes the card; it must not also follow the front card's link.
  const dragged = useRef(false);
  const onPointerDown = (e) => {
    dragStart.current = e.clientX;
    dragged.current = false;
  };
  const onPointerUp = (e) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(dx) < DRAG_PX) return;
    dragged.current = true;
    go(dx < 0 ? 1 : -1);
  };
  const onClickCapture = (e) => {
    if (!dragged.current) return;
    dragged.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={rootRef}
      className="layer-carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <div
        className="layer-carousel__stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (dragStart.current = null)}
        onClickCapture={onClickCapture}
      >
        {items.map((item, i) => {
          const d = offsetOf(i, active, count);
          const front = d === 0;
          return (
            // A side card comes to the front when clicked (the arrows do the same for
            // keyboard users, so the card itself needs no focus).
            <div
              className={`layer-carousel__card ${front ? "is-active" : ""}`}
              style={{ "--d": d, "--abs": Math.abs(d) }}
              role={front ? "group" : undefined}
              aria-roledescription={front ? "slide" : undefined}
              aria-label={front ? `${i + 1} of ${count}: ${item.label}` : undefined}
              aria-hidden={front ? undefined : true}
              onClick={front ? undefined : () => setActive(i)}
              key={item.src}
            >
              <span className="layer-carousel__label">{item.label}</span>
              <div className="layer-carousel__photo">
                <Image src={item.src} alt={item.alt} fill sizes="(min-width: 992px) 25vw, 60vw" />
              </div>
              <Link
                href={item.href}
                className="layer-carousel__link"
                tabIndex={front ? undefined : -1}
              >
                View solution
                <span className="visually-hidden">: {item.label}</span>
              </Link>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="layer-carousel__arrow layer-carousel__arrow--prev"
        aria-label="Previous card"
        onClick={() => go(-1)}
      >
        <Icon name="arrow-left" />
      </button>
      <button
        type="button"
        className="layer-carousel__arrow layer-carousel__arrow--next"
        aria-label="Next card"
        onClick={() => go(1)}
      >
        <Icon name="arrow-right" />
      </button>

      <button
        type="button"
        className="layer-carousel__play"
        aria-label={playing ? "Pause the cards" : "Play the cards"}
        aria-pressed={!playing}
        onClick={() => setPlaying((p) => !p)}
      >
        <Icon name={playing ? "pause-fill" : "play-fill"} />
      </button>

      {/* Announced only while paused, so auto-slide does not keep talking. */}
      <p className="visually-hidden" aria-live={playing ? "off" : "polite"}>
        {`Card ${active + 1} of ${count}: ${items[active].label}`}
      </p>
    </div>
  );
}
