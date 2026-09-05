"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContentItem, SiteSettings as SiteValue } from "@/lib/types";

function navigationText(site: SiteValue): string {
  return site.navigation.map((item) => `${item.label} | ${item.href}`).join("\n");
}

export function SiteSettings({ initialSite, content }: { initialSite: SiteValue; content: ContentItem[] }) {
  const [site, setSite] = useState(initialSite);
  const [navigation, setNavigation] = useState(() => navigationText(initialSite));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const parsedNavigation = navigation
      .split("\n")
      .map((line) => line.split("|").map((part) => part.trim()))
      .filter(([label, href]) => label && href?.startsWith("/"))
      .map(([label, href]) => ({ label, href }));
    const payload = { ...site, navigation: parsedNavigation };
    startTransition(async () => {
      const response = await fetch("/api/admin/settings/site", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = (await response.json()) as { error?: string };
      setMessage(response.ok ? "Site settings saved." : result.error || "Site settings could not be saved.");
      if (response.ok) router.refresh();
    });
  }

  return (
    <>
      <div className="admin-page-header"><div><span className="admin-kicker">Publication</span><h1>Site settings</h1><p>Shape the public identity, opening statement, featured work, navigation, and sharing metadata.</p></div></div>
      <form className="settings-form" onSubmit={submit}>
        <section className="settings-section"><div className="settings-section-copy"><h2>Identity</h2><p>The short name is used in compact marks. The canonical origin can stay empty when request detection is preferred.</p></div><div className="settings-fields"><label className="field"><span className="field-legend">Publication name</span><input className="input" value={site.name} onChange={(event) => setSite({ ...site, name: event.target.value })} required /></label><label className="field"><span className="field-legend">Short name</span><input className="input" value={site.shortName} onChange={(event) => setSite({ ...site, shortName: event.target.value })} required /></label><label className="field field-wide"><span className="field-legend">Description</span><textarea className="textarea" value={site.description} onChange={(event) => setSite({ ...site, description: event.target.value })} required /></label><label className="field field-wide"><span className="field-legend">Canonical site URL</span><input className="input" type="url" value={site.siteUrl} onChange={(event) => setSite({ ...site, siteUrl: event.target.value })} placeholder="Detected from the current request when empty" /><small>Set this after the final custom domain is connected.</small></label></div></section>
        <section className="settings-section"><div className="settings-section-copy"><h2>Opening statement</h2><p>Keep the headline compact enough to remain within two lines on a laptop.</p></div><div className="settings-fields"><label className="field field-wide"><span className="field-legend">Hero headline</span><input className="input" value={site.heroTitle} onChange={(event) => setSite({ ...site, heroTitle: event.target.value })} required /></label><label className="field field-wide"><span className="field-legend">Hero description</span><textarea className="textarea" value={site.heroSubtitle} onChange={(event) => setSite({ ...site, heroSubtitle: event.target.value })} required /></label><label className="field"><span className="field-legend">Featured content</span><select className="select" value={site.featuredContentId ?? ""} onChange={(event) => setSite({ ...site, featuredContentId: event.target.value || null })}><option value="">Use the highest-ranked feature</option>{content.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label className="field"><span className="field-legend">Default sharing image</span><input className="input" value={site.defaultOgImage} onChange={(event) => setSite({ ...site, defaultOgImage: event.target.value })} placeholder="/api/media/..." /></label></div></section>
        <section className="settings-section"><div className="settings-section-copy"><h2>Navigation and footer</h2><p>Use one item per line in the form “Label | /path”. Keep the desktop navigation to eight items or fewer.</p></div><div className="settings-fields"><label className="field field-wide"><span className="field-legend">Navigation</span><textarea className="textarea settings-code-input" value={navigation} onChange={(event) => setNavigation(event.target.value)} /></label><label className="field field-wide"><span className="field-legend">Footer note</span><input className="input" value={site.footerNote} onChange={(event) => setSite({ ...site, footerNote: event.target.value })} /></label></div></section>
        <div className="settings-savebar">{message ? <span role="status">{message}</span> : <span>Public metadata refreshes after saving.</span>}<button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving" : "Save site"}</button></div>
      </form>
    </>
  );
}
