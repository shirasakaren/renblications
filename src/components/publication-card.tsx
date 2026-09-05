import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ContentItem } from "@/lib/types";

const collectionByType: Record<ContentItem["type"], string> = {
  article: "articles",
  blog: "blogs",
  paper: "papers",
  publication: "publications",
  research: "research",
  essay: "essays",
  note: "notes",
  talk: "talks",
};

export function contentHref(item: ContentItem): string {
  return `/${collectionByType[item.type]}/${item.slug}`;
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
