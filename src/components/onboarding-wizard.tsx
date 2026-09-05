"use client";

import { ArrowLeft, ArrowRight, Eye, EyeSlash, LockKey, RocketLaunch } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { DEFAULT_ONBOARDING_PASSPHRASE } from "@/lib/defaults";
import { THEMES } from "@/lib/themes";
import type { ThemeMode } from "@/lib/types";
import { useTheme } from "./theme-provider";

const sections = ["Identity", "Author", "Appearance", "Launch"] as const;

interface OnboardingValues {
  siteName: string;
  siteDescription: string;
  authorName: string;
  authorBio: string;
  passphrase: string;
  themeId: string;
  mode: ThemeMode;
  includeStarterContent: boolean;
}

export function OnboardingWizard() {
  const [section, setSection] = useState(0);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState<OnboardingValues>({
    siteName: "Ren Publications",
    siteDescription: "Papers, research, essays, and working ideas by Ren.",
    authorName: "Ren",
    authorBio: "Independent researcher and writer working across technology, systems, and culture.",
    passphrase: DEFAULT_ONBOARDING_PASSPHRASE,
    themeId: "vermilion",
    mode: "system",
    includeStarterContent: true,
  });
  const router = useRouter();
  const reduce = useReducedMotion();
  const { preview } = useTheme();
  const chosenTheme = useMemo(
    () => THEMES.find((theme) => theme.id === values.themeId) ?? THEMES[0],
    [values.themeId],
  );

  function update<K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function nextSection() {
    setError("");
    if (section === 0 && (values.siteName.trim().length < 2 || values.siteDescription.trim().length < 10)) {
      setError("Add a site name and a clear description before continuing.");
      return;
    }
    if (section === 1 && (values.authorName.trim().length < 1 || values.passphrase.length < 10)) {
      setError("Add the author name and use a passphrase with at least 10 characters.");
      return;
    }
    setSection((current) => Math.min(sections.length - 1, current + 1));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (section < sections.length - 1) {
      nextSection();
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Setup could not be completed.");
      router.push("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Setup could not be completed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding-shell">
        <aside className="onboarding-aside">
          <div className="onboarding-brand">
            <span className="wordmark-mark">RP</span>
            <span>Publication setup</span>
          </div>
          <div className="onboarding-aside-copy">
            <h1>Make the archive yours.</h1>
            <p>Set the identity, secure the editor, choose the reading atmosphere, then publish from one place.</p>
            <div className="onboarding-steps" aria-label="Setup sections">
              {sections.map((item, index) => (
                <span className="onboarding-step" data-active={index === section} key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="onboarding-main">
          <form className="onboarding-form" onSubmit={submit}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={sections[section]}
                initial={reduce ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {section === 0 ? (
                  <>
                    <div className="form-heading">
                      <h2>Name the publication.</h2>
                      <p>This becomes the public wordmark, metadata, and identity throughout the reader experience.</p>
                    </div>
                    <div className="form-grid">
                      <div className="field field-wide">
                        <label htmlFor="site-name">Publication name</label>
                        <input id="site-name" className="input" value={values.siteName} onChange={(event) => update("siteName", event.target.value)} autoFocus />
                      </div>
                      <div className="field field-wide">
                        <label htmlFor="site-description">Short description</label>
                        <textarea id="site-description" className="textarea" value={values.siteDescription} onChange={(event) => update("siteDescription", event.target.value)} />
                        <small>Used in search results and when the site is shared.</small>
                      </div>
                    </div>
                  </>
                ) : null}

                {section === 1 ? (
                  <>
                    <div className="form-heading">
                      <h2>Introduce the author.</h2>
                      <p>The author profile appears below every publication. More links and an avatar can be added later.</p>
                    </div>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="author-name">Author name</label>
                        <input id="author-name" className="input" value={values.authorName} onChange={(event) => update("authorName", event.target.value)} autoFocus />
                      </div>
                      <div className="field">
                        <label htmlFor="passphrase">Admin passphrase</label>
                        <div className="password-wrap">
                          <input id="passphrase" className="input" type={showPassphrase ? "text" : "password"} value={values.passphrase} onChange={(event) => update("passphrase", event.target.value)} autoComplete="new-password" />
                          <button className="password-toggle" type="button" onClick={() => setShowPassphrase((current) => !current)} aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}>
                            {showPassphrase ? <EyeSlash size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                        <small>Change the provided starter passphrase before a public launch.</small>
                      </div>
                      <div className="field field-wide">
                        <label htmlFor="author-bio">Short biography</label>
                        <textarea id="author-bio" className="textarea" value={values.authorBio} onChange={(event) => update("authorBio", event.target.value)} />
                      </div>
                    </div>
                  </>
                ) : null}

                {section === 2 ? (
                  <>
                    <div className="form-heading">
                      <h2>Choose the atmosphere.</h2>
                      <p>Every palette has a matching light and dark reading mode. You can preview and change it at any time.</p>
                    </div>
                    <div className="choice-grid" aria-label="Reading mode">
                      {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
                        <button
                          className="choice"
                          data-selected={values.mode === mode}
                          type="button"
                          key={mode}
                          onClick={() => { update("mode", mode); preview(values.themeId, mode); }}
                        >
                          <strong>{mode[0].toUpperCase() + mode.slice(1)}</strong>
                          <span>{mode === "system" ? "Follow the reader's device" : `Always begin in ${mode}`}</span>
                        </button>
                      ))}
                    </div>
                    <div className="theme-gallery" aria-label="Theme gallery">
                      {THEMES.map((theme) => {
                        const palette = values.mode === "dark" ? theme.dark : theme.light;
                        return (
                          <button
                            className="theme-option"
                            data-selected={theme.id === values.themeId}
                            type="button"
                            key={theme.id}
                            title={theme.description}
                            onClick={() => { update("themeId", theme.id); preview(theme.id, values.mode); }}
                          >
                            <span className="theme-swatches" aria-hidden="true">
                              <span style={{ background: palette.bg }} />
                              <span style={{ background: palette.ink }} />
                              <span style={{ background: palette.accent }} />
                            </span>
                            <strong>{theme.name}</strong>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : null}

                {section === 3 ? (
                  <>
                    <div className="form-heading">
                      <h2>Ready for the first edition.</h2>
                      <p>Review the essentials. Everything except the original setup claim can be changed from the admin dashboard.</p>
                    </div>
                    <div className="review-card">
                      <div>
                        <h3>{values.siteName}</h3>
                        <p>{values.siteDescription}</p>
                      </div>
                      <dl className="review-list">
                        <div><dt>Author</dt><dd>{values.authorName}</dd></div>
                        <div><dt>Theme</dt><dd>{chosenTheme.name}, {values.mode}</dd></div>
                        <div><dt>Security</dt><dd><LockKey size={15} /> Salted passphrase</dd></div>
                        <div><dt>Editor</dt><dd>MDX and media ready</dd></div>
                      </dl>
                      <label className="check-row">
                        <input type="checkbox" checked={values.includeStarterContent} onChange={(event) => update("includeStarterContent", event.target.checked)} />
                        <span>Add four editable starter pieces so the public archive and analytics dashboard have a useful shape.</span>
                      </label>
                    </div>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>

            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="form-actions">
              <button className="button button-secondary" type="button" disabled={section === 0 || submitting} onClick={() => setSection((current) => Math.max(0, current - 1))}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="button button-primary" type="submit" disabled={submitting}>
                {section === sections.length - 1 ? (
                  <>{submitting ? "Creating archive" : "Open dashboard"} <RocketLaunch size={16} /></>
                ) : (
                  <>Continue <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
