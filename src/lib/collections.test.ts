import { describe, expect, it } from "vitest";
import { COLLECTIONS, contentPath, isAvailableContentPath } from "./collections";
import { THEMES } from "./themes";

describe("public publication paths", () => {
  it("uses the author-selected path without a generated category prefix", () => {
    expect(contentPath({ slug: "article1" })).toBe("/article1");
    expect(contentPath({ slug: "notes/field-test" })).toBe("/notes/field-test");
  });

  it("protects application routes while permitting nested publication paths", () => {
    expect(isAvailableContentPath("admin")).toBe(false);
    expect(isAvailableContentPath("articles")).toBe(false);
    expect(isAvailableContentPath("notes/field-test")).toBe(true);
    expect(isAvailableContentPath("some-random-word")).toBe(true);
  });

  it("ships all archive formats and at least twenty themes", () => {
    expect(Object.keys(COLLECTIONS)).toHaveLength(8);
    expect(THEMES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
  });
});
