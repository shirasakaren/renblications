"use client";

import {
  ArrowLeft,
  BracketsCurly,
  Check,
  Code,
  FileAudio,
  FilePdf,
  FileVideo,
  ImageSquare,
  Link as LinkIcon,
  ListBullets,
  Quotes,
  TextB,
  TextH,
  UploadSimple,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState, useTransition } from "react";
import { SafeMdx } from "@/components/safe-mdx";
import type { ContentDraft, ContentItem, ContentKind, MediaItem } from "@/lib/types";

const typeLabels: Record<ContentKind, string> = {
  article: "Article",
  blog: "Blog",
  paper: "Paper",
  publication: "Publication",
  research: "Research",
  essay: "Essay",
  note: "Note",
  talk: "Talk",
};

function toPath(value: string): string {
  return value
    .split("/")
    .map((segment) => segment.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("/")
    .slice(0, 96);
}

function blankDraft(type: ContentKind): ContentDraft {
  return {
    slug: "",
    type,
    status: "draft",
    title: "",
    subtitle: "",
    excerpt: "",
    mdx: "# Untitled\n\nBegin writing here.",
    coverUrl: "",
    documentUrl: "",
    tags: [],
    featured: false,
    featureRank: 0,
    seo: { title: "", description: "", canonicalUrl: "" },
    publishedAt: null,
    scheduledAt: null,
  };
}

function mediaSnippet(item: MediaItem): string {
  const title = item.name.replaceAll('"', "'");
  if (item.mimeType.startsWith("image/")) return `\n<Image src="${item.url}" alt="${item.alt.replaceAll('"', "'")}" title="${title}" />\n`;
  if (item.mimeType.startsWith("video/")) return `\n<Video src="${item.url}" title="${title}" />\n`;
  if (item.mimeType.startsWith("audio/")) return `\n<Audio src="${item.url}" title="${title}" />\n`;
  return `\n<Document src="${item.url}" title="${title}" />\n`;
}

function localDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ContentEditor({ initialItem, initialType, initialMedia }: { initialItem: ContentItem | null; initialType: ContentKind; initialMedia: MediaItem[] }) {
  const [draft, setDraft] = useState<ContentDraft>(() => initialItem ?? blankDraft(initialType));
  const [media, setMedia] = useState(initialMedia);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialItem?.slug));
  const [message, setMessage] = useState(initialItem ? "All saved" : "New draft");
  const [pending, startTransition] = useTransition();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function update<K extends keyof ContentDraft>(key: K, value: ContentDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("Unsaved changes");
  }

  function updateSeo(key: keyof ContentDraft["seo"], value: string) {
    setDraft((current) => ({ ...current, seo: { ...current.seo, [key]: value } }));
    setMessage("Unsaved changes");
  }

  function updateStatus(status: ContentDraft["status"]) {
    update("status", status);
    if (status === "scheduled" && !draft.scheduledAt) {
      update("scheduledAt", new Date(Date.now() + 3_600_000).toISOString());
    }
  }

  function insert(before: string, after = "", placeholder = "text") {
    const editor = textarea.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = draft.mdx.slice(start, end) || placeholder;
    const next = `${draft.mdx.slice(0, start)}${before}${selected}${after}${draft.mdx.slice(end)}`;
    update("mdx", next);
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertAtCursor(value: string) {
    const editor = textarea.current;
    if (!editor) return;
    const start = editor.selectionStart;
    update("mdx", `${draft.mdx.slice(0, start)}${value}${draft.mdx.slice(editor.selectionEnd)}`);
    requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start + value.length, start + value.length); });
  }

  function addLink() {
    const url = window.prompt("Link URL", "https://");
    if (url) insert("[", `](${url})`, "link text");
  }

  function addYouTube() {
    const url = window.prompt("YouTube URL", "https://www.youtube.com/watch?v=");
    if (url) insertAtCursor(`\n<YouTube url="${url}" title="Video" />\n`);
  }

  function save() {
    if (!draft.title.trim()) {
      setMessage("Add a title before saving.");
      return;
    }
    startTransition(async () => {
      setMessage("Saving");
      const endpoint = draft.id ? `/api/admin/content/${draft.id}` : "/api/admin/content";
      const response = await fetch(endpoint, {
        method: draft.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as { item?: ContentItem; error?: string };
      if (!response.ok || !result.item) {
        setMessage(result.error || "Save failed.");
        return;
      }
      setDraft(result.item);
      setMessage("All saved");
      if (!initialItem) router.replace(`/admin/editor/${result.item.id}`);
      router.refresh();
    });
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    body.set("alt", file.name);
    startTransition(async () => {
      setMessage("Uploading media");
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const result = (await response.json()) as { item?: MediaItem; error?: string };
      if (!response.ok || !result.item) {
        setMessage(result.error || "Upload failed.");
        return;
      }
      setMedia((current) => [result.item as MediaItem, ...current]);
      insertAtCursor(mediaSnippet(result.item));
      setMessage("Media inserted. Save the draft when ready.");
      if (uploadInput.current) uploadInput.current.value = "";
    });
  }

  return (
    <div className="editor-page">
      <div className="editor-header">
        <Link className="admin-icon-control" href="/admin/content" aria-label="Back to content"><ArrowLeft size={17} /></Link>
        <div className="editor-heading"><input aria-label="Content title" value={draft.title} onChange={(event) => { const title = event.target.value; update("title", title); if (!slugTouched) update("slug", toPath(title)); }} placeholder="Untitled publication" /><span>{message}</span></div>
        <select className="editor-status" value={draft.status} onChange={(event) => updateStatus(event.target.value as ContentDraft["status"])}><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select>
        <button className="button button-primary" type="button" onClick={save} disabled={pending}><Check size={16} /> {pending ? "Working" : "Save"}</button>
      </div>

      <div className="editor-meta-grid">
        <label className="field"><span className="field-legend">Format</span><select className="select" value={draft.type} onChange={(event) => update("type", event.target.value as ContentKind)}>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="field"><span className="field-legend">Public URL</span><span className="editor-url-field"><span aria-hidden="true">/</span><input className="input" aria-label="Public URL path" value={draft.slug} onChange={(event) => { setSlugTouched(true); update("slug", toPath(event.target.value)); }} placeholder="article1" /></span><small>Choose any short path, such as /article1 or /notes/field-test.</small></label>
        <label className="field"><span className="field-legend">Tags</span><input className="input" value={draft.tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="design, systems, research" /></label>
        <label className="field"><span className="field-legend">Subtitle</span><input className="input" value={draft.subtitle} onChange={(event) => update("subtitle", event.target.value)} /></label>
        <label className="field field-wide"><span className="field-legend">Summary</span><textarea className="textarea editor-summary" value={draft.excerpt} onChange={(event) => update("excerpt", event.target.value)} /></label>
        <label className="field"><span className="field-legend">Cover URL</span><input className="input" value={draft.coverUrl} onChange={(event) => update("coverUrl", event.target.value)} placeholder="/api/media/..." /></label>
        <label className="field"><span className="field-legend">Document URL</span><input className="input" value={draft.documentUrl} onChange={(event) => update("documentUrl", event.target.value)} placeholder="PDF or document" /></label>
        <label className="admin-switch-row editor-feature-switch"><span><strong>Featured</strong><small>Eligible for the homepage lead.</small></span><input type="checkbox" checked={draft.featured} onChange={(event) => update("featured", event.target.checked)} /></label>
        <label className="field"><span className="field-legend">Feature rank</span><input className="input" type="number" min={0} max={1000} value={draft.featureRank} onChange={(event) => update("featureRank", Number(event.target.value))} /></label>
      </div>

      <div className="editor-options-grid">
        <section className="editor-option-panel">
          <div><span className="editor-option-kicker">Publishing</span><h2>Timing and visibility</h2></div>
          <div className="settings-fields">
            {draft.status === "scheduled" ? <label className="field field-wide"><span className="field-legend">Publish at</span><input className="input" type="datetime-local" value={localDateTime(draft.scheduledAt)} onChange={(event) => update("scheduledAt", event.target.value ? new Date(event.target.value).toISOString() : null)} required /><small>Publishing is promoted automatically on the first request after this time.</small></label> : null}
            <label className="field"><span className="field-legend">Published date</span><input className="input" type="datetime-local" value={localDateTime(draft.publishedAt)} onChange={(event) => update("publishedAt", event.target.value ? new Date(event.target.value).toISOString() : null)} /></label>
          </div>
        </section>
        <section className="editor-option-panel">
          <div><span className="editor-option-kicker">Discovery</span><h2>Search and sharing</h2></div>
          <div className="settings-fields">
            <label className="field"><span className="field-legend">SEO title</span><input className="input" value={draft.seo.title} onChange={(event) => updateSeo("title", event.target.value)} placeholder={draft.title || "Page title"} maxLength={70} /></label>
            <label className="field"><span className="field-legend">Canonical URL</span><input className="input" type="url" value={draft.seo.canonicalUrl} onChange={(event) => updateSeo("canonicalUrl", event.target.value)} placeholder="Optional external canonical" /></label>
            <label className="field field-wide"><span className="field-legend">SEO description</span><textarea className="textarea editor-summary" value={draft.seo.description} onChange={(event) => updateSeo("description", event.target.value)} placeholder={draft.excerpt || "Search result summary"} maxLength={180} /></label>
          </div>
        </section>
      </div>

      <div className="editor-toolbar" aria-label="MDX formatting">
        <button type="button" onClick={() => insert("## ", "", "Heading")} title="Heading"><TextH size={17} /></button>
        <button type="button" onClick={() => insert("**", "**", "bold text")} title="Bold"><TextB size={17} /></button>
        <button type="button" onClick={() => insert("- ", "", "List item")} title="List"><ListBullets size={17} /></button>
        <button type="button" onClick={() => insert("> ", "", "Quote")} title="Quote"><Quotes size={17} /></button>
        <button type="button" onClick={() => insert("`", "`", "code")} title="Inline code"><Code size={17} /></button>
        <button type="button" onClick={() => insert("\n```ts\n", "\n```\n", "code")} title="Code block"><BracketsCurly size={17} /></button>
        <button type="button" onClick={addLink} title="Link"><LinkIcon size={17} /></button>
        <button type="button" onClick={addYouTube} title="YouTube"><FileVideo size={17} /></button>
        <button type="button" onClick={() => insertAtCursor('\n:::callout title="Note"\nWrite the callout here.\n:::\n')} title="Callout"><FilePdf size={17} /></button>
        <label title="Upload and insert"><UploadSimple size={17} /><input ref={uploadInput} type="file" onChange={upload} /></label>
      </div>

      <div className="editor-workspace">
        <section className="editor-source"><div className="editor-pane-label">MDX source</div><textarea ref={textarea} value={draft.mdx} onChange={(event) => update("mdx", event.target.value)} spellCheck /></section>
        <section className="editor-preview"><div className="editor-pane-label">Live preview</div><article><SafeMdx source={draft.mdx} /></article></section>
      </div>

      <section className="editor-media-tray"><div className="editor-pane-label">Recent media</div><div>{media.slice(0, 12).map((item) => <button type="button" key={item.id} onClick={() => insertAtCursor(mediaSnippet(item))} title={`Insert ${item.name}`}>{item.mimeType.startsWith("image/") ? <ImageSquare size={16} /> : item.mimeType.startsWith("video/") ? <FileVideo size={16} /> : item.mimeType.startsWith("audio/") ? <FileAudio size={16} /> : <FilePdf size={16} />}<span>{item.name}</span></button>)}{!media.length ? <p>Upload an asset to make it available here.</p> : null}</div></section>
    </div>
  );
}
