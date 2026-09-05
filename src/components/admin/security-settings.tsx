"use client";

import { FormEvent, useState, useTransition } from "react";
import type { AnalyticsSettings } from "@/lib/types";

export function SecuritySettings({ initialAnalytics }: { initialAnalytics: AnalyticsSettings }) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [nextPassphrase, setNextPassphrase] = useState("");
  const [analyticsMessage, setAnalyticsMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function saveAnalytics(event: FormEvent) {
    event.preventDefault();
    setAnalyticsMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/settings/analytics", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(analytics) });
      const result = (await response.json()) as { error?: string };
      setAnalyticsMessage(response.ok ? "Analytics policy saved." : result.error || "Analytics policy could not be saved.");
    });
  }

  function changePassphrase(event: FormEvent) {
    event.preventDefault();
    setSecurityMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/settings/passphrase", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassphrase, nextPassphrase }) });
      const result = (await response.json()) as { error?: string };
      if (response.ok) {
        setCurrentPassphrase("");
        setNextPassphrase("");
      }
      setSecurityMessage(response.ok ? "Passphrase changed. Other sessions were closed." : result.error || "Passphrase could not be changed.");
    });
  }

  return (
    <>
      <div className="admin-page-header"><div><span className="admin-kicker">Control</span><h1>Security and data</h1><p>Manage the single-author passphrase, first-party measurement, retention, and reader privacy defaults.</p></div></div>
      <div className="settings-form">
        <form className="settings-section" onSubmit={saveAnalytics}><div className="settings-section-copy"><h2>Analytics policy</h2><p>Balanced mode keeps a user-agent string for device reporting. Strict mode drops it while preserving aggregate attention signals.</p></div><div className="settings-fields"><label className="admin-switch-row"><span><strong>First-party analytics</strong><small>Capture views, active reading, scroll depth, media, links, and campaign context.</small></span><input type="checkbox" checked={analytics.enabled} onChange={(event) => setAnalytics({ ...analytics, enabled: event.target.checked })} /></label><label className="admin-switch-row"><span><strong>Respect Do Not Track</strong><small>Requests with DNT enabled are accepted without storing an event.</small></span><input type="checkbox" checked={analytics.respectDoNotTrack} onChange={(event) => setAnalytics({ ...analytics, respectDoNotTrack: event.target.checked })} /></label><label className="field"><span className="field-legend">Privacy mode</span><select className="select" value={analytics.privacyMode} onChange={(event) => setAnalytics({ ...analytics, privacyMode: event.target.value as AnalyticsSettings["privacyMode"] })}><option value="strict">Strict</option><option value="balanced">Balanced</option></select></label><label className="field"><span className="field-legend">Retention in days</span><input className="input" type="number" min={7} max={730} value={analytics.retentionDays} onChange={(event) => setAnalytics({ ...analytics, retentionDays: Number(event.target.value) })} /></label><div className="settings-inline-action">{analyticsMessage ? <span role="status">{analyticsMessage}</span> : <span>Raw IP addresses are never stored.</span>}<button className="button button-primary" type="submit" disabled={pending}>Save analytics</button></div></div></form>
        <form className="settings-section" onSubmit={changePassphrase}><div className="settings-section-copy"><h2>Admin passphrase</h2><p>Changing it revokes every existing session and immediately signs this browser back in with the new credential.</p></div><div className="settings-fields"><label className="field"><span className="field-legend">Current passphrase</span><input className="input" type="password" value={currentPassphrase} onChange={(event) => setCurrentPassphrase(event.target.value)} autoComplete="current-password" required /></label><label className="field"><span className="field-legend">New passphrase</span><input className="input" type="password" minLength={10} value={nextPassphrase} onChange={(event) => setNextPassphrase(event.target.value)} autoComplete="new-password" required /></label><div className="settings-inline-action">{securityMessage ? <span role="status">{securityMessage}</span> : <span>Use at least ten characters.</span>}<button className="button button-primary" type="submit" disabled={pending}>Change passphrase</button></div></div></form>
      </div>
    </>
  );
}
