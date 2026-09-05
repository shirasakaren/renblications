"use client";

import { List, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { NavItem } from "@/lib/types";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ name, shortName, navigation }: { name: string; shortName: string; navigation: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <>
      <header className="site-header">
        <div className="site-shell site-header-inner">
          <Link className="wordmark" href="/" aria-label={`${name} home`}>
            <span className="wordmark-mark">{shortName}</span>
            <span>{name}</span>
          </Link>
          <nav className="nav-list" aria-label="Primary navigation">
            {navigation.map((item) => (
              <Link className="nav-link" href={item.href} key={`${item.href}-${item.label}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <button
              className="menu-button"
              type="button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {open ? (
          <motion.nav
            className="mobile-nav"
            aria-label="Mobile navigation"
            initial={reduce ? false : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {navigation.map((item) => (
              <Link href={item.href} key={`${item.href}-${item.label}`} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </>
  );
}
