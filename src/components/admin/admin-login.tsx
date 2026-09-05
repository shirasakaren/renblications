"use client";

import { ArrowRight, Eye, EyeSlash, LockKey } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminLogin({ siteName, shortName }: { siteName: string; shortName: string }) {
  const [passphrase, setPassphrase] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const reduce = useReducedMotion();

  async function login(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Sign in failed.");
      router.push("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <motion.section
        className="admin-login-card"
        initial={reduce ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="admin-login-mark">{shortName}</div>
        <p className="admin-login-kicker"><LockKey size={14} /> Private workspace</p>
        <h1>Return to the editor.</h1>
        <p>Enter the passphrase for {siteName}. This device stays signed in for 30 days.</p>
        <form onSubmit={login}>
          <div className="field">
            <label htmlFor="admin-passphrase">Passphrase</label>
            <div className="password-wrap">
              <input
                id="admin-passphrase"
                className="input"
                type={visible ? "text" : "password"}
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                autoComplete="current-password"
                autoFocus
                required
              />
              <button className="password-toggle" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide passphrase" : "Show passphrase"}>
                {visible ? <EyeSlash size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button-primary admin-login-submit" type="submit" disabled={submitting || !passphrase}>
            {submitting ? "Opening workspace" : "Open workspace"} <ArrowRight size={16} />
          </button>
        </form>
        <Link className="admin-login-back" href="/">Back to publication</Link>
      </motion.section>
    </main>
  );
}
