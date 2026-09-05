"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface NetworkInformation {
  effectiveType?: string;
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function storedId(storage: Storage, key: string): string {
  const current = storage.getItem(key);
  if (current) return current;
  const next = randomId();
  storage.setItem(key, next);
  return next;
}

function send(body: Record<string, unknown>, beacon = false): void {
  const payload = JSON.stringify(body);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/track", new Blob([payload], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  });
}

export function Analytics({ contentId }: { contentId?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const visitorId = storedId(window.localStorage, "ren-publications-visitor");
    const sessionId = storedId(window.sessionStorage, "ren-publications-session");
    const params = Object.fromEntries(searchParams.entries());
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const base = {
      contentId: contentId ?? null,
      path: pathname,
      referrer: document.referrer,
      visitorId,
      sessionId,
      client: {
        locale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        connection: connection?.effectiveType ?? "",
      },
    };
    send({ ...base, event: "page_view", properties: { campaign: params } });

    let activeStarted = document.visibilityState === "visible" ? Date.now() : 0;
    let activeMs = 0;
    let maxDepth = 0;
    const thresholds = new Set<number>();
    const playedMedia = new WeakSet<HTMLMediaElement>();

    const commitActive = () => {
      if (activeStarted) activeMs += Date.now() - activeStarted;
      activeStarted = document.visibilityState === "visible" ? Date.now() : 0;
    };

    const onVisibility = () => commitActive();
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const depth = available > 0 ? Math.min(100, Math.round((window.scrollY / available) * 100)) : 100;
      maxDepth = Math.max(maxDepth, depth);
      [25, 50, 75, 90, 100].forEach((threshold) => {
        if (depth >= threshold && !thresholds.has(threshold)) {
          thresholds.add(threshold);
          send({ ...base, event: "scroll_depth", properties: { depth: threshold } });
        }
      });
    };

    const flush = () => {
      commitActive();
      if (activeMs >= 1_000) {
        send(
          {
            ...base,
            event: "engagement",
            properties: { seconds: Math.round(activeMs / 1000), maxDepth },
          },
          true,
        );
        activeMs = 0;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const copyButton = event.target.closest<HTMLElement>("[data-copy-code]");
      if (copyButton) {
        send({ ...base, event: "copy_code", properties: {} });
        return;
      }
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      if (link.matches(".recommendation-card")) {
        send({ ...base, event: "recommendation_click", properties: { destination: link.pathname } });
        return;
      }
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) {
        send({
          ...base,
          event: "outbound_click",
          properties: { destinationHost: destination.hostname, destinationPath: destination.pathname },
        });
      }
    };

    const onMediaPlay = (event: Event) => {
      if (!(event.target instanceof HTMLMediaElement) || playedMedia.has(event.target)) return;
      playedMedia.add(event.target);
      const source = new URL(event.target.currentSrc || event.target.src, window.location.href);
      send({ ...base, event: "media_play", properties: { mediaType: event.target.tagName.toLowerCase(), sourceHost: source.hostname } });
    };

    const onMediaComplete = (event: Event) => {
      if (!(event.target instanceof HTMLMediaElement)) return;
      const source = new URL(event.target.currentSrc || event.target.src, window.location.href);
      send({ ...base, event: "media_complete", properties: { mediaType: event.target.tagName.toLowerCase(), sourceHost: source.hostname } });
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    document.addEventListener("play", onMediaPlay, true);
    document.addEventListener("ended", onMediaComplete, true);
    window.addEventListener("pagehide", flush);
    const interval = window.setInterval(flush, 30_000);
    onScroll();
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      document.removeEventListener("play", onMediaPlay, true);
      document.removeEventListener("ended", onMediaComplete, true);
      window.removeEventListener("pagehide", flush);
      window.clearInterval(interval);
    };
  }, [contentId, pathname, searchParams]);

  return null;
}
