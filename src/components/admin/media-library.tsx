"use client";

import { ArrowSquareOut, Copy, File, FileAudio, FilePdf, FileVideo, ImageSquare, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState, useTransition } from "react";
import type { MediaItem } from "@/lib/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MediaIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageSquare size={24} />;
  if (mimeType.startsWith("video/")) return <FileVideo size={24} />;
  if (mimeType.startsWith("audio/")) return <FileAudio size={24} />;
  if (mimeType === "application/pdf") return <FilePdf size={24} />;
  return <File size={24} />;
}

export function MediaLibrary({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [alt, setAlt] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    setMessage("");
    const body = new FormData();
    body.set("file", file);
    body.set("alt", alt);
    startTransition(async () => {
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const result = (await response.json()) as { item?: MediaItem; error?: string };
      if (!response.ok || !result.item) {
        setMessage(result.error || "Upload failed.");
        return;
      }
      setMedia((current) => [result.item as MediaItem, ...current]);
      setAlt("");
      if (input.current) input.current.value = "";
      setMessage("Upload complete. The media URL is ready to use.");
    });
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage("Media URL copied.");
  }

  return (
    <>
      <div className="admin-page-header">
        <div><span className="admin-kicker">Assets</span><h1>Media library</h1><p>Images, video, audio, PDFs, presentations, spreadsheets, and text documents for MDX publications.</p></div>
      </div>
      <section className="media-upload-panel">
        <div className="media-upload-copy"><div className="media-upload-icon"><UploadSimple size={21} /></div><div><h2>Add a file</h2><p>Browser-playable formats render inline. Other documents keep a preview and download path.</p></div></div>
        <div className="media-upload-controls">
          <label className="field"><span className="field-legend">Alternative text</span><input className="input" value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Describe the asset" /></label>
          <label className="button button-primary media-file-button">{pending ? "Uploading" : "Choose file"}<input ref={input} type="file" onChange={(event) => upload(event.target.files?.[0])} disabled={pending} /></label>
        </div>
      </section>
      {message ? <p className="admin-inline-message" role="status">{message}</p> : null}
      <section className="media-grid" aria-busy={pending}>
        {media.map((item) => (
          <article className="media-card" key={item.id}>
            <div className="media-preview">
              {item.mimeType.startsWith("image/") ? (
                // User-managed media can resolve to the same-origin API or an external CDN.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.alt} loading="lazy" />
              ) : item.mimeType.startsWith("video/") ? (
                <video src={item.url} preload="metadata" />
              ) : (
                <MediaIcon mimeType={item.mimeType} />
              )}
            </div>
            <div className="media-card-copy"><strong title={item.name}>{item.name}</strong><span>{formatBytes(item.size)} · {item.mimeType}</span></div>
            <div className="media-card-actions"><button className="admin-icon-control" type="button" onClick={() => copy(item.url)} aria-label={`Copy URL for ${item.name}`}><Copy size={16} /></button><a className="admin-icon-control" href={item.url} target="_blank" rel="noreferrer" aria-label={`Open ${item.name}`}><ArrowSquareOut size={16} /></a></div>
          </article>
        ))}
        {!media.length ? <div className="admin-empty media-empty"><ImageSquare size={28} /><h2>No media yet</h2><p>Upload the first asset to make it available in every editor.</p></div> : null}
      </section>
    </>
  );
}
