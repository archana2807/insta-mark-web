"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import "yet-another-react-lightbox/styles.css";

// Lightbox JS only loads when someone opens a photo.
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), { ssr: false });

/** Masonry gallery of executed work; click → full-screen lightbox. */
export default function Gallery({ images, label }) {
  const [index, setIndex] = useState(-1);

  if (!images?.length) return null;

  return (
    <>
      <ul className="gallery-grid list-unstyled mb-0" aria-label={label}>
        {images.map((img, i) => (
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
                width={img.width}
                height={img.height}
                sizes="(min-width: 992px) 33vw, (min-width: 576px) 50vw, 100vw"
              />
            </button>
          </li>
        ))}
      </ul>
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
