import { randomUUID } from "node:crypto";
import type { ContentItem } from "./types";

const now = new Date().toISOString();

export function createStarterContent(): ContentItem[] {
  return [
    {
      id: randomUUID(),
      slug: "designing-for-the-space-between-signals",
      type: "article",
      status: "published",
      title: "Designing for the space between signals",
      subtitle: "What durable interfaces leave unsaid",
      excerpt: "A practical essay about attention, restraint, and the decisions that make an interface feel trustworthy.",
      mdx: `# Designing for the space between signals

The most useful interfaces do not compete with the work. They clarify what changed, preserve a sense of place, and leave enough quiet for judgment.

## The visible layer

Every control should answer three questions: what can I do, what just happened, and how do I recover? When those answers are clear, decoration can become atmosphere instead of compensation.

> Restraint is not the absence of expression. It is expression with a reason.

## A small operating principle

| Moment | What the reader needs |
| --- | --- |
| Arrival | A clear promise |
| Reading | Stable rhythm |
| Action | Immediate feedback |
| Return | A remembered place |

\`\`\`ts
export function keepTheSignal(value: string) {
  return value.trim().replace(/\\s+/g, " ");
}
\`\`\`
`,
      coverUrl: "/images/archive-hero.png",
      documentUrl: "",
      tags: ["design", "systems", "attention"],
      featured: true,
      featureRank: 1,
      seo: { title: "", description: "", canonicalUrl: "" },
      publishedAt: now,
      scheduledAt: null,
      createdAt: now,
      updatedAt: now,
      readingMinutes: 3,
    },
    {
      id: randomUUID(),
      slug: "durable-interfaces-in-practice",
      type: "blog",
      status: "published",
      title: "Durable interfaces in practice",
      subtitle: "Notes from building software that has to age well",
      excerpt: "A working checklist for products that must remain understandable after the launch energy fades.",
      mdx: `# Durable interfaces in practice

Software ages through many small decisions. Naming, defaults, empty states, and recovery paths matter longer than the first animation.

## Keep the model visible

Users should be able to predict what will happen before they act. Good labels and stable placement make that prediction possible.

## Design the return visit

The second visit is often more important than the first. Preserve filters, reading position, drafts, and the explanation behind important settings.
`,
      coverUrl: "",
      documentUrl: "",
      tags: ["design", "product", "practice"],
      featured: false,
      featureRank: 2,
      seo: { title: "", description: "", canonicalUrl: "" },
      publishedAt: now,
      scheduledAt: null,
      createdAt: now,
      updatedAt: now,
      readingMinutes: 2,
    },
    {
      id: randomUUID(),
      slug: "selective-memory-in-long-running-systems",
      type: "paper",
      status: "published",
      title: "Selective memory in long-running systems",
      subtitle: "A paper stub ready for its final PDF",
      excerpt: "An exploration of retention, retrieval cost, and the value of deliberate forgetting in evolving systems.",
      mdx: `# Selective memory in long-running systems

## Abstract

Long-running systems accumulate context faster than they accumulate understanding. This paper studies how selective retention can improve retrieval quality while preserving accountability.

## Materials

Attach the final PDF in the editor. The publication page will render it inline and keep a direct download available.

:::callout title="Editor note"
This starter paper is intentionally short. Replace it with the full manuscript and upload its PDF from the media library.
:::
`,
      coverUrl: "",
      documentUrl: "",
      tags: ["systems", "memory", "research"],
      featured: false,
      featureRank: 3,
      seo: { title: "", description: "", canonicalUrl: "" },
      publishedAt: now,
      scheduledAt: null,
      createdAt: now,
      updatedAt: now,
      readingMinutes: 2,
    },
    {
      id: randomUUID(),
      slug: "legible-infrastructure",
      type: "research",
      status: "published",
      title: "Legible infrastructure",
      subtitle: "Research notes on systems people can reason about",
      excerpt: "How operational surfaces can expose enough context for confident decisions without turning into a cockpit.",
      mdx: `# Legible infrastructure

Operational software often exposes every measurement and explains none of them. Legibility starts by connecting a signal to the decision it is meant to support.

## Research questions

- Which state changes deserve interruption?
- What context makes an alert actionable?
- How can history remain readable without becoming noise?
`,
      coverUrl: "",
      documentUrl: "",
      tags: ["infrastructure", "research", "systems"],
      featured: false,
      featureRank: 4,
      seo: { title: "", description: "", canonicalUrl: "" },
      publishedAt: now,
      scheduledAt: null,
      createdAt: now,
      updatedAt: now,
      readingMinutes: 2,
    },
  ];
}
