"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { FormEvent, useState, useTransition } from "react";
import type { AuthorProfile } from "@/lib/types";

export function ProfileSettings({ initialProfile }: { initialProfile: AuthorProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/settings/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = (await response.json()) as { error?: string };
      setMessage(response.ok ? "Author profile saved." : result.error || "Profile could not be saved.");
    });
  }

  return (
    <>
      <div className="admin-page-header"><div><span className="admin-kicker">Identity</span><h1>Author profile</h1><p>This profile closes every piece and gives readers a direct path to the person behind the work.</p></div></div>
      <form className="settings-form" onSubmit={submit}>
        <section className="settings-section"><div className="settings-section-copy"><h2>Public identity</h2><p>Use either an uploaded avatar URL or a Gravatar email. An uploaded image takes priority.</p></div><div className="settings-fields"><label className="field"><span className="field-legend">Display name</span><input className="input" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label><label className="field"><span className="field-legend">Location</span><input className="input" value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} placeholder="Optional" /></label><label className="field field-wide"><span className="field-legend">Biography</span><textarea className="textarea" value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /></label><label className="field"><span className="field-legend">Avatar URL</span><input className="input" value={profile.avatarUrl} onChange={(event) => setProfile({ ...profile, avatarUrl: event.target.value })} placeholder="/api/media/... or https://" /></label><label className="field"><span className="field-legend">Gravatar email</span><input className="input" type="email" value={profile.gravatarEmail} onChange={(event) => setProfile({ ...profile, gravatarEmail: event.target.value })} placeholder="Optional" /></label></div></section>
        <section className="settings-section"><div className="settings-section-copy"><h2>External links</h2><p>Add profiles, contact points, institutional pages, or anywhere readers should continue.</p></div><div className="settings-fields"><div className="settings-link-list">{profile.links.map((link, index) => <div className="settings-link-row" key={`${index}-${link.url}`}><input className="input" aria-label="Link label" value={link.label} onChange={(event) => setProfile({ ...profile, links: profile.links.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })} placeholder="Label" /><input className="input" aria-label="Link URL" value={link.url} onChange={(event) => setProfile({ ...profile, links: profile.links.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item) })} placeholder="https://" /><button className="admin-icon-control danger" type="button" aria-label="Remove link" onClick={() => setProfile({ ...profile, links: profile.links.filter((_, itemIndex) => itemIndex !== index) })}><Trash size={16} /></button></div>)}</div><button className="button button-secondary settings-add-link" type="button" onClick={() => setProfile({ ...profile, links: [...profile.links, { label: "", url: "https://" }] })}><Plus size={15} /> Add link</button></div></section>
        <div className="settings-savebar">{message ? <span role="status">{message}</span> : <span>Changes appear on every publication.</span>}<button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving" : "Save profile"}</button></div>
      </form>
    </>
  );
}
