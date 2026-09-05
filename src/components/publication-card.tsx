import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { contentPath } from "@/lib/collections";
import type { ContentItem } from "@/lib/types";

export function contentHref(item: ContentItem): string {
  return contentPath(item);
}

export function PublicationCard({ item }: { item: ContentItem }) {
  return (
    <Link className="publication-card" href={contentHref(item)}>
      <div className="card-top">
        <span>{item.type}</span>
        <span>{item.readingMinutes} min</span>
        <ArrowUpRight className="card-arrow" size={17} aria-hidden="true" />
      </div>
      <div>
        <h3 className="card-title">{item.title}</h3>
        <p className="card-excerpt">{item.excerpt}</p>
        <div className="card-tags" aria-label="Tags">
          {item.tags.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
