import { afterEach, describe, expect, it } from "vitest";
import {
  anonymizeVisitor,
  estimateReadingMinutes,
  hashPassphrase,
  normalizeContentPath,
  parseCookieHeader,
  verifyPassphrase,
} from "./security";

const originalSecret = process.env.SESSION_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
});

describe("publication security helpers", () => {
  it("hashes and verifies passphrases without storing plaintext", async () => {
    const encoded = await hashPassphrase("a long publication passphrase");
    expect(encoded).not.toContain("a long publication passphrase");
    await expect(verifyPassphrase("a long publication passphrase", encoded)).resolves.toBe(true);
    await expect(verifyPassphrase("incorrect passphrase", encoded)).resolves.toBe(false);
  });

  it("creates stable daily anonymous visitor hashes", () => {
    process.env.SESSION_SECRET = "test-secret-with-at-least-32-characters";
    expect(anonymizeVisitor("127.0.0.1", "visitor-a")).toBe(anonymizeVisitor("127.0.0.1", "visitor-a"));
    expect(anonymizeVisitor("127.0.0.1", "visitor-a")).not.toBe(anonymizeVisitor("127.0.0.2", "visitor-a"));
  });

  it("normalizes editable nested publication paths", () => {
    expect(normalizeContentPath("/Notes/Field Test/")).toBe("notes/field-test");
    expect(normalizeContentPath("  Some Random Word  ")).toBe("some-random-word");
  });

  it("parses encoded cookies and estimates nonzero reading time", () => {
    expect(parseCookieHeader("theme=dark; author=Ren%20S")).toEqual({ theme: "dark", author: "Ren S" });
    expect(estimateReadingMinutes("A short publication.")).toBe(1);
  });
});
