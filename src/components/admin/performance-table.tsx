"use client";

import { ArrowDown, ArrowUp, ArrowsDownUp } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ContentPerformance } from "@/lib/types";

type SortKey = "attentionScore" | "views" | "visitors" | "engagedSeconds" | "averageScroll" | "updatedAt";

export function PerformanceTable({ items }: { items: ContentPerformance[] }) {
  const [sort, setSort] = useState<SortKey>("attentionScore");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const sorted = useMemo(
    () => items.toSorted((a, b) => {
      const left = sort === "updatedAt" ? Date.parse(a.updatedAt) : a[sort];
      const right = sort === "updatedAt" ? Date.parse(b.updatedAt) : b[sort];
      return (left - right) * (direction === "asc" ? 1 : -1);
    }),
    [direction, items, sort],
  );

  function choose(key: SortKey) {
    if (key === sort) setDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setDirection("desc");
    }
  }

  const header = (label: string, key: SortKey) => (
    <button type="button" onClick={() => choose(key)}>
      {label} {sort === key ? (direction === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : <ArrowsDownUp size={12} />}
    </button>
  );

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Content</th><th>{header("Attention", "attentionScore")}</th><th>{header("Views", "views")}</th><th>{header("Readers", "visitors")}</th><th>{header("Read time", "engagedSeconds")}</th><th>{header("Depth", "averageScroll")}</th></tr></thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.id}>
              <td><Link href={`/admin/editor/${item.id}`}><strong>{item.title}</strong><span>{item.type} · {item.status}</span></Link></td>
              <td><strong>{item.attentionScore}</strong></td>
              <td>{item.views.toLocaleString()}</td>
              <td>{item.visitors.toLocaleString()}</td>
              <td>{Math.round(item.engagedSeconds / 60)}m</td>
              <td>{item.averageScroll}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length ? <div className="admin-table-empty">Performance appears after readers begin exploring the archive.</div> : null}
    </div>
  );
}
