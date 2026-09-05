"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { type ComponentProps, useState } from "react";

export function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const value = typeof children === "string" ? children : "";
    const nodeText = value || document.activeElement?.closest(".code-frame")?.querySelector("code")?.textContent || "";
    await navigator.clipboard.writeText(nodeText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  }

  return (
    <div className="code-frame">
      <button type="button" className="code-copy" onClick={copy} data-copy-code aria-label="Copy code">
        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}
