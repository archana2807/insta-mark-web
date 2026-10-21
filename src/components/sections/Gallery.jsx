"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import ClientIcon from "@/components/ui/ClientIcon";
import "yet-another-react-lightbox/styles.css";
import Reveal from "@/components/ui/Reveal";

// Lightbox JS only loads when someone opens a photo.
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), { ssr: false });

/**
 * Even photo grid (same-size tiles, cropped to fill) of executed work.
 * Long galleries show the first `initial` photos with a "Show all" button.
 * Click a photo → full-screen lightbox with the whole, uncropped image.
 */
export default function Gallery({ images, label, initial = 9 }) {
  const [index, setIndex] = useState(-1);
  const [expanded, setExpanded] = useState(false);

  if (!images?.length) return null;
  const visible = expanded ? images : images.slice(0, initial);
  const hidden = images.length - visible.length;

  return (
    <>
      <Reveal as="ul" stagger={80} className="gallery-grid list-unstyled mb-0" aria-label={label}>
        {visible.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              className="gallery-item"
              onClick={() => setIndex(i)}
              aria-label={`Open photo: ${img.alt}`}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="(min-width: 992px) 33vw, (min-width: 576px) 50vw, 100vw"
              />
            </button>
          </li>
        ))}
      </Reveal>
      {hidden > 0 && (
        <div className="text-center mt-5">
          <button
            type="button"
            className="btn btn-outline-ink btn-lg"
            onClick={() => setExpanded(true)}
          >
            Show all {images.length} photos <ClientIcon name="arrow-down" />
          </button>
        </div>
      )}
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
    </>
  );
}
