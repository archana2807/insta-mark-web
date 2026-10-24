"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import ClientIcon from "@/components/ui/ClientIcon";
import "yet-another-react-lightbox/styles.css";

// Lightbox JS only loads when someone opens a photo.
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), { ssr: false });

const INTERVAL_MS = 3500; // auto-play: the next card every 3.5 s
const DRAG_PX = 50; // how far a drag or swipe must go to change the card
const WHEEL_PX = 40; // sideways trackpad scroll needed for one card
const SHOWN = 2; // cards visible on each side of the front one

/**
 * Where a card sits relative to the front one: 0 = front, ±1 = beside it, … The cards wrap
 * round, so the last card sits left of the first.
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
 * Fanned photo deck for "Where it is used" on solution pages (client, 24 Oct 2026;
 * reference: a "quote deck"). The front card stands upright in the middle; the others fan
 * out to both sides, leaning away, smaller and dimmer, and fade out at the edges.
 *  - Auto-play loops through the cards. It waits while the mouse is over the deck, while a
 *    control has focus, while it is off screen and while the tab is hidden. A pause/play
 *    button stops it (WCAG 2.2.2); it does not start by itself for prefers-reduced-motion.
 *  - A drag or swipe (the cards follow the finger), a sideways trackpad scroll, the arrow
 *    keys, the prev/next buttons, the dots or a click on a side card change the card.
 *  - The front card opens the full photo in the lightbox; only it is exposed to assistive
 *    technology.
 * @param {{ images: { src: string, alt: string, width?: number, height?: number }[],
 *   label: string }} props
 * @returns {JSX.Element | null}
 */
export default function CardDeck({ images, label }) {
  const count = images?.length ?? 0;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [drag, setDrag] = useState(null); // live drag offset, in card spreads
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const go = useCallback((delta) => setActive((i) => (i + delta + count) % count), [count]);

  // Reduced motion: no automatic change; the visitor can still press play.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  // Only play while the deck is on screen and the tab is visible.
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

  // One timer per card: a manual change (new `active`) starts the wait again.
  useEffect(() => {
    if (!playing || hovering || focused || !inView || !tabVisible || drag !== null || count < 2)
      return undefined;
    const timer = window.setTimeout(() => go(1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, hovering, focused, inView, tabVisible, drag, active, count, go]);

  // Sideways trackpad / shift+wheel scroll steps through the cards; up-down still scrolls
  // the page.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    let sum = 0;
    let lockedUntil = 0;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (e.timeStamp < lockedUntil) return;
      sum += e.deltaX;
      if (Math.abs(sum) < WHEEL_PX) return;
      go(sum > 0 ? 1 : -1);
      sum = 0;
      lockedUntil = e.timeStamp + 450;
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [go]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else return;
    e.preventDefault();
  };

  // Drag or swipe: the cards follow the finger; on release the nearest card comes forward.
  // A drag must not also open the front photo.
  const start = useRef(null);
  const dragged = useRef(false);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, width: stageRef.current?.offsetWidth || 1 };
    dragged.current = false;
  };
  const onPointerMove = (e) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (!dragged.current && Math.abs(dx) < 6) return;
    if (!dragged.current) e.currentTarget.setPointerCapture(e.pointerId);
    dragged.current = true;
    // One step (the distance between two cards) is about 40% of the stage.
    setDrag(dx / (s.width * 0.4));
  };
  const onPointerUp = (e) => {
    const s = start.current;
    if (!s) return;
    start.current = null;
    setDrag(null);
    const dx = e.clientX - s.x;
    if (!dragged.current || Math.abs(dx) < DRAG_PX) return;
    const steps = Math.max(1, Math.round(Math.abs(dx) / (s.width * 0.4)));
    go(dx < 0 ? steps : -steps);
  };
  const onClickCapture = (e) => {
    if (!dragged.current) return;
    dragged.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  if (!count) return null;

  return (
    <div
      ref={rootRef}
      className="card-deck"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <div
        ref={stageRef}
        className={`card-deck__stage ${drag !== null ? "is-dragging" : ""}`}
        style={{ "--drag": drag ?? 0 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {images.map((img, i) => {
          const d = offsetOf(i, active, count);
          const front = d === 0;
          const far = Math.abs(d) > SHOWN;
          return (
            <div
              key={img.src}
              className={`card-deck__card ${front ? "is-active" : ""} ${far ? "is-far" : ""}`}
              style={{ "--d": d, "--abs": Math.min(Math.abs(d), SHOWN + 1) }}
              role={front ? "group" : undefined}
              aria-roledescription={front ? "slide" : undefined}
              aria-label={front ? `${i + 1} of ${count}` : undefined}
              aria-hidden={front ? undefined : true}
              // A side card comes to the front when clicked (keyboard users use the
              // buttons or the arrow keys, so it needs no focus).
              onClick={front ? undefined : () => setActive(i)}
            >
              <button
                type="button"
                className="card-deck__photo"
                tabIndex={front ? undefined : -1}
                onClick={front ? () => setOpen(true) : undefined}
                aria-label={`Open photo: ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="(min-width: 992px) 26vw, 60vw"
                  draggable={false}
                />
              </button>
              <p className="card-deck__caption">
                <span className="card-deck__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="card-deck__text">{img.alt}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="card-deck__controls" hidden={count < 2}>
        <div className="card-deck__dots">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.src}
              className={i === active ? "is-active" : ""}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === active || undefined}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
        <div className="card-deck__buttons">
          <button type="button" aria-label="Previous photo" onClick={() => go(-1)}>
            <ClientIcon name="arrow-left" />
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause the photo deck" : "Play the photo deck"}
            aria-pressed={!playing}
            onClick={() => setPlaying((p) => !p)}
          >
            <ClientIcon name={playing ? "pause-fill" : "play-fill"} />
          </button>
          <button type="button" aria-label="Next photo" onClick={() => go(1)}>
            <ClientIcon name="arrow-right" />
          </button>
        </div>
      </div>

      {/* Announced only while paused, so auto-play does not keep talking. */}
      <p className="visually-hidden" aria-live={playing ? "off" : "polite"}>
        {`Photo ${active + 1} of ${count}: ${images[active].alt}`}
      </p>

      {open && (
        <Lightbox
          open
          index={active}
          close={() => setOpen(false)}
          slides={images.map((img) => ({
            src: img.src,
            alt: img.alt,
            width: img.width,
            height: img.height,
          }))}
        />
      )}
    </div>
  );
}
