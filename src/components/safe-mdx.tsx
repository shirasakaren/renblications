import ReactMarkdown from "react-markdown";
import type { ComponentProps } from "react";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { CodeBlock } from "./code-block";
import { MediaBlock, type MediaKind } from "./media-block";

interface MarkdownBlock {
  type: "markdown";
  source: string;
}

interface EmbedBlock {
  type: "embed";
  kind: MediaKind;
  src: string;
  title: string;
  alt: string;
}

interface CalloutBlock {
  type: "callout";
  title: string;
  source: string;
}

type Block = MarkdownBlock | EmbedBlock | CalloutBlock;

function SecondLevelHeading({ node, ...props }: ComponentProps<"h1"> & { node?: unknown }) {
  void node;
  return <h2 {...props} />;
}

const customBlock = /:::callout(?:\s+title="([^"]*)")?\s*\n([\s\S]*?)\n:::|<(YouTube|Video|Audio|Document|Image|LinkPreview)\s+([^>]*?)\s*\/>/g;
const attribute = /([a-zA-Z]+)="([^"]*)"/g;

function attributes(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of source.matchAll(attribute)) result[match[1].toLowerCase()] = match[2];
  return result;
}

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let index = 0;
  for (const match of source.matchAll(customBlock)) {
    const start = match.index ?? 0;
    if (start > index) blocks.push({ type: "markdown", source: source.slice(index, start) });
    if (match[2] !== undefined) {
      blocks.push({ type: "callout", title: match[1] || "Note", source: match[2] });
    } else {
      const props = attributes(match[4] ?? "");
      const kindByName: Record<string, MediaKind> = {
        YouTube: "youtube",
        Video: "video",
        Audio: "audio",
        Document: "document",
        Image: "image",
        LinkPreview: "link",
      };
      blocks.push({
        type: "embed",
        kind: kindByName[match[3]] ?? "link",
        src: props.src || props.url || "",
        title: props.title || match[3],
        alt: props.alt || "",
      });
    }
    index = start + match[0].length;
  }
  if (index < source.length) blocks.push({ type: "markdown", source: source.slice(index) });
  return blocks;
}

function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      components={{
        pre: CodeBlock,
        h1: SecondLevelHeading,
      }}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
    >
      {source}
    </ReactMarkdown>
  );
}

function withoutRepeatedTitle(source: string, title?: string): string {
  if (!title) return source;
  const firstHeading = source.match(/^#\s+(.+)\r?\n+/);
  return firstHeading?.[1].trim() === title.trim() ? source.slice(firstHeading[0].length) : source;
}

export function SafeMdx({ source, title }: { source: string; title?: string }) {
  const body = withoutRepeatedTitle(source, title);
  return (
    <div className="prose">
      {parseBlocks(body).map((block, index) => {
        if (block.type === "markdown") return <Markdown source={block.source} key={`markdown-${index}`} />;
        if (block.type === "callout") {
          return (
            <aside className="mdx-callout" key={`callout-${index}`}>
              <p className="mdx-callout-title">{block.title}</p>
              <Markdown source={block.source} />
            </aside>
          );
        }
        return block.src ? <MediaBlock {...block} key={`embed-${index}`} /> : null;
      })}
    </div>
  );
}
