"use client";

/* eslint-disable @next/next/no-img-element -- image URLs and dimensions are API-controlled */

import { useState } from "react";
import type { MediaRef } from "./types";

export function ProjectImageGallery({
  images,
  title,
}: {
  images: MediaRef[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  const active = images[selected] ?? images[0];

  return (
    <div className="project-media" aria-label={`ภาพประกอบ ${title}`}>
      <picture className="project-main-image">
        {active.fallback_url ? (
          <source srcSet={active.url} type="image/webp" />
        ) : null}
        <img
          src={active.fallback_url ?? active.url}
          width={active.width}
          height={active.height}
          alt={active.alt}
        />
      </picture>
      {images.length > 1 ? (
        <div className="project-thumbnails" aria-label="เลือกมุมภาพ">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`ดูภาพที่ ${index + 1}: ${image.alt}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <img
                src={image.fallback_url ?? image.url}
                width={image.width}
                height={image.height}
                alt=""
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
