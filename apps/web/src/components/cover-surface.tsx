import Image from "next/image";
import type { CategoryTone } from "@xblog/contracts";

function toneClassName(tone: CategoryTone) {
  if (tone === "pink") {
    return "cover-pink";
  }

  if (tone === "green") {
    return "cover-green";
  }

  if (tone === "blue") {
    return "cover-blue";
  }

  return "";
}

type CoverSurfaceProps = {
  coverUrl: string | null | undefined;
  tone: CategoryTone;
  className: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
};

export function CoverSurface({
  coverUrl,
  tone,
  className,
  alt,
  sizes = "100vw",
  priority = false,
}: CoverSurfaceProps) {
  const classes = [className, "cover-surface", toneClassName(tone), coverUrl ? "has-image" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {coverUrl ? (
        <>
          <Image
            alt={alt}
            className="cover-surface-image"
            fill
            priority={priority}
            sizes={sizes}
            src={coverUrl}
            unoptimized
          />
          <div className="cover-surface-overlay" />
        </>
      ) : null}
    </div>
  );
}
