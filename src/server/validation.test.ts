import { describe, expect, it } from "vitest";
import { contentSchema } from "./validation";

const draft = {
  slug: "a-short-path",
  type: "article" as const,
  status: "draft" as const,
  title: "A title",
  subtitle: "",
  excerpt: "",
  mdx: "Body",
  coverUrl: "",
  documentUrl: "",
  tags: [],
  featured: false,
  featureRank: 0,
  seo: { title: "", description: "", canonicalUrl: "" },
  publishedAt: null,
  scheduledAt: null,
};

describe("content validation", () => {
  it("accepts direct and nested custom paths", () => {
    expect(contentSchema.parse(draft).slug).toBe("a-short-path");
    expect(contentSchema.parse({ ...draft, slug: "journal/field-note" }).slug).toBe("journal/field-note");
  });

  it("rejects reserved routes", () => {
    expect(() => contentSchema.parse({ ...draft, slug: "admin" })).toThrow(/reserved/i);
  });

  it("requires a date for scheduled work", () => {
    expect(() => contentSchema.parse({ ...draft, status: "scheduled" })).toThrow(/publication date/i);
    expect(contentSchema.parse({ ...draft, status: "scheduled", scheduledAt: "2030-01-01T08:00:00.000Z" }).status).toBe("scheduled");
  });
});
