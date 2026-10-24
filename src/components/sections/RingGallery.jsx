"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import ClientIcon from "@/components/ui/ClientIcon";
import "yet-another-react-lightbox/styles.css";

// Lightbox JS only loads when someone opens a photo.
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), { ssr: false });

const SPEED = 0.12; // auto drift, in cards per second ("very slowly", client, 24 Oct 2026)
const EDGE_GROW = 0.5; // edge cards are this much bigger than the middle one
const MAX_TILT = 32; // degrees an edge card leans in towards the middle
const GAP = 0.09; // gap between cards, in middle-card widths
const ASPECT = 1.6; // portrait cards: height / width
const FRICTION = 3.5; // how fast a fling slows down (per second)
const STEP = 0.02; // resolution of the position table, in cards

/**
 * Cards visible side by side for a stage width (fewer on phones, so photos stay readable).
 * One fewer than before on every screen, so each card is a little bigger (client, 24 Oct
 * 2026).
 * @param {number} width
 * @returns {number}
 */
function cardsAcross(width) {
  if (width >= 1200) return 7;
  if (width >= 768) return 5;
  return 3;
}

/**
 * The ring's shape for one stage width. Cards grow and lean in towards both edges, so equal
 * steps along the ring do not give equal gaps on screen. The table maps "cards from the
 * middle" to a screen x where every gap comes out the same (solved in projected space).
 * @param {number} width stage width in px
 * @returns {{ card: number, half: number, slot: number, table: number[] }}
 */
function buildRing(width) {
  const half = width / 2;
  const card = width / cardsAcross(width) / (1 + EDGE_GROW / 3);
  const table = [0];
  let x = 0;
  // Walk outwards until a card is fully off screen.
  while (x < half + card * (1 + EDGE_GROW) * 1.5) {
    const k = Math.min(x / half, 1);
    const tilt = (MAX_TILT * k * Math.PI) / 180;
    x += (card * (1 + EDGE_GROW * k * k) * Math.cos(tilt) + card * GAP) * STEP;
    table.push(x);
  }
  return { card, half, slot: card * (1 + GAP), table };
}

/**
 * Screen x for a card `t` cards away from the middle (negative = left).
 * @param {number[]} table
 * @param {number} t
 * @returns {number | null} null when the card is off screen
 */
function xAt(table, t) {
  const f = Math.abs(t) / STEP;
  const i = Math.floor(f);
  if (i >= table.length - 1) return null;
  const x = table[i] + (table[i + 1] - table[i]) * (f - i);
  return t < 0 ? -x : x;
}

/**
 * Executed-work gallery on solution pages (client, 24 Oct 2026; reference: a "ring" media
 * gallery). Portrait photos stand on a ring that curls round the viewer: smallest in the
 * middle, bigger and leaning in towards both edges.
 *  - The ring drifts slowly from left to right by itself. A drag or swipe, a sideways
 *    trackpad scroll, the arrow keys, or scrolling the page (down = right, up = left) push
 *    it, and it keeps drifting in the direction it was last pushed.
 *  - It only moves while on screen and while the tab is visible. A pause/play button stops
 *    it (WCAG 2.2.2); prefers-reduced-motion starts it paused, with no scroll push.
 *  - Short galleries are repeated to fill the ring; only the first copy of each photo is in
 *    the tab order and read by screen readers. Focusing a photo turns it to the middle.
 *  - Click a photo → full-screen lightbox with the whole, uncropped image.
 * @param {{ images: { src: string, alt: string, width: number, height: number }[],
 *   label: string }} props
 * @returns {JSX.Element | null}
 */
export default function RingGallery({ images, label }) {
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(true);
  const [copies, setCopies] = useState(1);
  const stageRef = useRef(null);
  const cardsRef = useRef([]);
  const playingRef = useRef(true);
  const motion = useRef({
    pos: 0,
    vel: 0,
    dir: 1,
    target: null,
    ring: null,
    dragged: false,
    dragging: false,
  });
  const count = images?.length ?? 0;
  const total = count * copies;

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Reduced motion: no drift by itself; the visitor can still press play.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  // Ring size follows the stage width; repeat the photos until the ring is full.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !count) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const ring = buildRing(entry.contentRect.width);
      motion.current.ring = ring;
      stage.style.setProperty("--card-w", `${ring.card}px`);
      // Tallest card: an edge one, a little taller again for its lean (shadows may spill).
      stage.style.height = `${ring.card * ASPECT * (1 + EDGE_GROW) * 1.08}px`;
      const needed = Math.ceil(((ring.table.length - 1) * STEP + 1) * 2);
      setCopies(Math.max(1, Math.ceil(needed / count)));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [count]);

  // The animation loop: writes transforms straight to the cards (no React render per frame).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !total) return undefined;
    const m = motion.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = 0;
    let inView = false;

    const draw = () => {
      const { ring } = m;
      if (!ring) return;
      cardsRef.current.forEach((el, j) => {
        if (!el) return;
        // Cards sit one per slot; wrap round so the ring never ends.
        let t = (((j + m.pos) % total) + total) % total;
        if (t > total / 2) t -= total;
        const x = xAt(ring.table, t);
        if (x === null) {
          el.style.opacity = "0";
          el.style.transform = `translateX(${t < 0 ? -ring.half * 2 : ring.half * 2}px)`;
          return;
        }
        const k = Math.min(Math.abs(x) / ring.half, 1);
        const scale = 1 + EDGE_GROW * k * k;
        const tilt = MAX_TILT * k * Math.sign(x);
        el.style.opacity = "1";
        el.style.zIndex = String(Math.round(k * 10));
        el.style.transform = `translateX(${x}px) scale(${scale}) perspective(${ring.card * 4}px) rotateY(${tilt}deg)`;
      });
    };

    const tick = (now) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      if (m.target !== null) {
        // Ease towards a chosen card (keyboard focus / arrow keys).
        const d = m.target - m.pos;
        m.pos += d * Math.min(dt * 8, 1);
        if (Math.abs(d) < 0.001) {
          m.pos = m.target;
          m.target = null;
        }
      } else if (!m.dragging) {
        m.pos += m.vel * dt;
        m.vel *= Math.exp(-FRICTION * dt);
        if (Math.abs(m.vel) < 0.01) m.vel = 0;
        if (playingRef.current) m.pos += m.dir * SPEED * dt;
      }
      draw();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame || !inView || document.visibilityState !== "visible") return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    });
    observer.observe(stage);
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    document.addEventListener("visibilitychange", onVisibility);

    // Page scroll pushes the ring: down → right, up → left.
    let lastY = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!inView || reduced || !m.ring || !dy) return;
      m.vel += (dy / m.ring.slot) * 0.6;
      m.dir = Math.sign(dy);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Sideways trackpad / shift+wheel scroll moves the ring like a strip; up-down still
    // scrolls the page.
    const onWheel = (e) => {
      if (!m.ring || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      m.target = null;
      m.pos -= e.deltaX / m.ring.slot;
      m.dir = -Math.sign(e.deltaX);
      if (!frame) draw();
    };
    stage.addEventListener("wheel", onWheel, { passive: false });

    draw();
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      stage.removeEventListener("wheel", onWheel);
    };
  }, [total]);

  // Drag or swipe: the ring follows the finger, then keeps the fling and its direction.
  const drag = useRef(null);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = motion.current;
    m.target = null;
    m.dragged = false;
    drag.current = { id: e.pointerId, x: e.clientX, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    const m = motion.current;
    if (!d || d.id !== e.pointerId || !m.ring) return;
    if (!m.dragged) {
      if (Math.abs(e.clientX - d.x) < 6) return;
      // Only now capture the pointer, so a plain click still reaches the photo button.
      m.dragged = true;
      m.dragging = true;
      m.target = null;
      m.vel = 0;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const dx = (e.clientX - d.lastX) / m.ring.slot;
    const dt = Math.max((e.timeStamp - d.lastT) / 1000, 0.001);
    m.pos += dx;
    d.v = d.v * 0.6 + (dx / dt) * 0.4;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    const m = motion.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!m.dragging) return;
    m.dragging = false;
    m.vel = Math.max(-12, Math.min(12, d.v));
    if (Math.abs(d.v) > 0.05) m.dir = Math.sign(d.v);
  };
  // A drag must not also open the photo it started on.
  const onClickCapture = (e) => {
    if (!motion.current.dragged) return;
    motion.current.dragged = false;
    e.preventDefault();
    e.stopPropagation();
  };

  // Turn card `j` (or the nearest copy of it) to the middle.
  const bringToMiddle = (j) => {
    const m = motion.current;
    let target = -j;
    target += Math.round((m.pos - target) / total) * total;
    m.target = target;
    m.vel = 0;
  };
  const onKeyDown = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const m = motion.current;
    const step = e.key === "ArrowRight" ? 1 : -1;
    m.target = Math.round(m.target ?? m.pos) + step;
    m.vel = 0;
    m.dir = step;
  };

  if (!count) return null;
  const cards = Array.from({ length: total }, (_, j) => images[j % count]);

  return (
    <div className="ring-gallery">
      <ul
        ref={stageRef}
        className="ring-gallery__stage list-unstyled mb-0"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        {cards.map((img, j) => {
          const copy = j >= count;
          return (
            <li
              key={`${img.src}-${j}`}
              ref={(el) => (cardsRef.current[j] = el)}
              className="ring-gallery__card"
              aria-hidden={copy || undefined}
            >
              <button
                type="button"
                className="ring-gallery__photo"
                tabIndex={copy ? -1 : undefined}
                onClick={() => setIndex(j % count)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && bringToMiddle(j)}
                aria-label={`Open photo: ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="(min-width: 1200px) 22vw, (min-width: 768px) 28vw, 45vw"
                  draggable={false}
                />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="ring-gallery__play"
        aria-label={playing ? "Pause the photos" : "Play the photos"}
        aria-pressed={!playing}
        onClick={() => setPlaying((p) => !p)}
      >
        <ClientIcon name={playing ? "pause-fill" : "play-fill"} />
      </button>
      {index >= 0 && (
        <Lightbox
          open
          index={index}
          close={() => setIndex(-1)}
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
