"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";

export type MediaKind = "youtube" | "video" | "audio" | "document" | "image" | "link";

function youtubeEmbed(value: string): string | null {
  try {
    const url = new URL(value);
    const id = url.hostname.includes("youtu.be")
      ? url.pathname.slice(1)
      : url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1);
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
  } catch {
    return /^[\w-]{6,20}$/.test(value) ? `https://www.youtube-nocookie.com/embed/${value}` : null;
  }
}

export function MediaBlock({ kind, src, title = "Embedded media", alt = "" }: { kind: MediaKind; src: string; title?: string; alt?: string }) {
  if (kind === "youtube") {
    const embed = youtubeEmbed(src);
    if (!embed) return null;
    return (
      <figure className="media-block">
        <iframe
          src={embed}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <figcaption className="media-caption">{title}</figcaption>
      </figure>
    );
  }
  if (kind === "video") {
    return (
      <figure className="media-block">
        <video controls preload="metadata" src={src} />
        <figcaption className="media-caption">{title}</figcaption>
      </figure>
    );
  }
  if (kind === "audio") {
    return (
      <figure className="media-block">
        <audio controls preload="metadata" src={src} />
        <figcaption className="media-caption">{title}</figcaption>
      </figure>
    );
  }
  if (kind === "document") {
    return (
      <figure className="media-block">
        <object data={src} aria-label={title}>
          <a href={src}>Open {title}</a>
        </object>
        <figcaption className="media-caption">{title}</figcaption>
      </figure>
    );
  }
  if (kind === "image") {
    return (
      <figure className="media-block">
        {/* Media URLs are author-controlled and can use same-origin uploads or a remote CDN. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
        {title ? <figcaption className="media-caption">{title}</figcaption> : null}
      </figure>
    );
  }
  return (
    <a className="link-preview" href={src} rel="noreferrer" target="_blank">
      <strong>{title}</strong>
      <span>{src}</span>
      <ArrowSquareOut size={17} aria-hidden="true" />
    </a>
  );
}
