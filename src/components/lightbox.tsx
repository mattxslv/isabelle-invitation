"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon } from "./ornaments";

type Full = { avif: string; webp: string; width: number; height: number };

// Tap or keyboard-activate to view the whole photo. Uses the native <dialog>:
// focus moves inside, Escape closes, focus returns to the trigger.
export function Lightbox({
  full,
  alt,
  label,
  children,
  className = "",
}: {
  full: Full;
  alt: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);

  const open = () => {
    setLoaded(true);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" className={`photo-trigger ${className}`} onClick={open} aria-label={label} aria-haspopup="dialog">
        {children}
      </button>
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={alt}
        onClick={(e) => {
          // Clicks on the backdrop or empty space close; clicks on the photo don't.
          if (e.target === e.currentTarget) close();
        }}
      >
        <button type="button" className="lightbox-close" onClick={close} aria-label="Close photo" autoFocus>
          <Icon name="close" size={22} strokeWidth={1.8} />
        </button>
        <figure className="lightbox-figure" onClick={(e) => e.target === e.currentTarget && close()}>
          {loaded && (
            <picture>
              <source type="image/avif" srcSet={full.avif} />
              <img src={full.webp} alt={alt} width={full.width} height={full.height} decoding="async" />
            </picture>
          )}
        </figure>
      </dialog>
    </>
  );
}
