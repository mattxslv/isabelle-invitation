import photos from "@/content/photos.generated.json";

export type PhotoId = keyof typeof photos;

type Props = {
  id: PhotoId;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

// Pre-optimized responsive photo. Dimensions are reserved via width/height
// and a tiny blurred placeholder sits underneath until the image decodes.
export function Photo({ id, alt, sizes, priority = false, className = "" }: Props) {
  const photo = photos[id];
  const avif = photo.sources.map((s) => `${s.avif} ${s.width}w`).join(", ");
  const webp = photo.sources.map((s) => `${s.webp} ${s.width}w`).join(", ");
  const fallback = photo.sources[1] ?? photo.sources[0];
  return (
    <picture>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      <img
        src={fallback.webp}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={`photo-bg ${className}`}
        style={{ backgroundImage: `url(${photo.placeholder})` }}
        draggable={false}
      />
    </picture>
  );
}

export function fullPhoto(id: PhotoId) {
  return photos[id].full;
}
