"use client";

import { ArrowUpRight, Books, MagnifyingGlass, NotePencil, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { contentPath } from "@/lib/collections";
import type { ContentItem, ContentKind } from "@/lib/types";

export function ContentManager({ items, type, title }: { items: ContentItem[]; type?: ContentKind; title: string }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !normalized || `${item.title} ${item.excerpt} ${item.tags.join(" ")}`.toLowerCase().includes(normalized);
      return matchesQuery && (status === "all" || item.status === status);
    });
  }, [items, query, status]);

  function remove(item: ContentItem) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    startTransition(async () => {
      const response = await fetch(`/api/admin/content/${item.id}`, { method: "DELETE" });
      if (response.ok) router.refresh();
    });
  }

  return (
    <>
      <div className="admin-page-header">
        <div><span className="admin-kicker">Library</span><h1>{title}</h1><p>{items.length} pieces across drafts, scheduled work, and the public archive.</p></div>
        <Link className="button button-primary" href={`/admin/editor/new${type ? `?type=${type}` : ""}`}><NotePencil size={16} /> Add {type ?? "content"}</Link>
      </div>
      <div className="admin-toolbar">
        <label className="admin-search"><MagnifyingGlass size={17} /><span className="sr-only">Search content</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, tags, and summaries" /></label>
        <label className="admin-filter"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select></label>
      </div>
      <div className="content-list" aria-busy={pending}>
        {filtered.map((item) => (
          <article className="content-list-row" key={item.id}>
            <div className="content-type-mark">{item.type.slice(0, 2).toUpperCase()}</div>
            <div className="content-list-copy"><div className="content-list-meta"><span data-status={item.status}>{item.status}</span><span>{item.type}</span><span>{new Date(item.updatedAt).toLocaleDateString()}</span></div><h2><Link href={`/admin/editor/${item.id}`}>{item.title}</Link></h2><p>{item.excerpt || "No summary yet."}</p></div>
            <div className="content-list-actions"><Link className="admin-icon-control" href={`/admin/editor/${item.id}`} aria-label={`Edit ${item.title}`}><NotePencil size={17} /></Link>{item.status === "published" ? <Link className="admin-icon-control" href={contentPath(item)} target="_blank" aria-label={`View ${item.title}`}><ArrowUpRight size={17} /></Link> : null}<button className="admin-icon-control danger" type="button" onClick={() => remove(item)} aria-label={`Delete ${item.title}`}><Trash size={17} /></button></div>
          </article>
        ))}
        {!filtered.length ? <div className="admin-empty"><Books size={28} /><h2>No matching content</h2><p>Clear the filters or start a new piece in this format.</p></div> : null}
      </div>
    </>
  );
}
