"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { THEMES } from "@/lib/themes";
import type { AppearanceSettings as AppearanceValue, ThemeMode } from "@/lib/types";
import { useTheme } from "@/components/theme-provider";

export function AppearanceSettings({ initialAppearance }: { initialAppearance: AppearanceValue }) {
  const [appearance, setAppearance] = useState(initialAppearance);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const { preview } = useTheme();
  const router = useRouter();

  function update(next: AppearanceValue) {
    setAppearance(next);
    preview(next.themeId, next.mode);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/settings/appearance", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(appearance) });
      const result = (await response.json()) as { error?: string };
      setMessage(response.ok ? "Appearance saved for the public site." : result.error || "Appearance could not be saved.");
      if (response.ok) router.refresh();
    });
  }

  return (
    <>
      <div className="admin-page-header"><div><span className="admin-kicker">Design system</span><h1>Appearance</h1><p>Twenty-four complete palettes, paired reading modes, and one semantic token system for instant site-wide updates.</p></div></div>
      <form className="settings-form" onSubmit={submit}>
        <section className="settings-section"><div className="settings-section-copy"><h2>Reading mode</h2><p>System follows the reader device. Visitors can switch modes when the control remains enabled.</p></div><div className="settings-fields"><div className="choice-grid settings-choice-grid">{(["system", "light", "dark"] as ThemeMode[]).map((mode) => <button className="choice" data-selected={appearance.mode === mode} type="button" key={mode} onClick={() => update({ ...appearance, mode })}><strong>{mode[0].toUpperCase() + mode.slice(1)}</strong><span>{mode === "system" ? "Match the reader" : `Prefer ${mode}`}</span></button>)}</div><label className="admin-switch-row"><span><strong>Visitor mode control</strong><small>Let readers switch between system, light, and dark.</small></span><input type="checkbox" checked={appearance.allowVisitorMode} onChange={(event) => setAppearance({ ...appearance, allowVisitorMode: event.target.checked })} /></label></div></section>
        <section className="settings-section"><div className="settings-section-copy"><h2>Theme catalog</h2><p>Every theme preserves the same hierarchy and interaction model while changing the visual temperature.</p></div><div className="theme-gallery admin-theme-gallery">{THEMES.map((theme) => { const palette = appearance.mode === "dark" ? theme.dark : theme.light; return <button className="theme-option" data-selected={appearance.themeId === theme.id} type="button" title={theme.description} key={theme.id} onClick={() => update({ ...appearance, themeId: theme.id })}><span className="theme-swatches"><span style={{ background: palette.bg }} /><span style={{ background: palette.ink }} /><span style={{ background: palette.accent }} /></span><strong>{theme.name}</strong><small>{theme.description}</small></button>; })}</div></section>
        <section className="settings-section"><div className="settings-section-copy"><h2>Texture and motion</h2><p>Keep expression intentional and provide a quieter option for long editorial sessions.</p></div><div className="settings-fields"><label className="admin-switch-row"><span><strong>Paper grain</strong><small>A fixed low-opacity texture that does not repaint while scrolling.</small></span><input type="checkbox" checked={appearance.showGrain} onChange={(event) => setAppearance({ ...appearance, showGrain: event.target.checked })} /></label><label className="field"><span className="field-legend">Motion level</span><select className="select" value={appearance.motionLevel} onChange={(event) => setAppearance({ ...appearance, motionLevel: event.target.value as AppearanceValue["motionLevel"] })}><option value="reduced">Reduced</option><option value="standard">Standard</option><option value="expressive">Expressive</option></select></label></div></section>
        <div className="settings-savebar">{message ? <span role="status">{message}</span> : <span>Theme choices preview immediately.</span>}<button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving" : "Save appearance"}</button></div>
      </form>
    </>
  );
}
