"use client";

import {
  Article,
  BookOpenText,
  Books,
  ChartLineUp,
  Flask,
  GearSix,
  House,
  ImageSquare,
  List,
  MicrophoneStage,
  Newspaper,
  NotePencil,
  PaintBrush,
  PenNib,
  SignOut,
  SquaresFour,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const groups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/admin", icon: SquaresFour },
      { label: "All content", href: "/admin/content", icon: Books },
      { label: "Analytics", href: "/admin/analytics", icon: ChartLineUp },
      { label: "Media", href: "/admin/media", icon: ImageSquare },
    ],
  },
  {
    label: "Formats",
    items: [
      { label: "Articles", href: "/admin/articles", icon: Article },
      { label: "Blogs", href: "/admin/blogs", icon: Newspaper },
      { label: "Papers", href: "/admin/papers", icon: BookOpenText },
      { label: "Publications", href: "/admin/publications", icon: PenNib },
      { label: "Research", href: "/admin/research", icon: Flask },
      { label: "Notes", href: "/admin/notes", icon: NotePencil },
      { label: "Talks", href: "/admin/talks", icon: MicrophoneStage },
    ],
  },
  {
    label: "Publication",
    items: [
      { label: "Profile", href: "/admin/profile", icon: UserCircle },
      { label: "Appearance", href: "/admin/appearance", icon: PaintBrush },
      { label: "Site settings", href: "/admin/site", icon: GearSix },
    ],
  },
] as const;

export function AdminShell({
  siteName,
  shortName,
  authorName,
  children,
}: {
  siteName: string;
  shortName: string;
  authorName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <>
      <div className="admin-brand-row">
        <Link className="admin-brand" href="/admin" onClick={() => setOpen(false)}>
          <span>{shortName}</span>
          <div><strong>{siteName}</strong><small>{authorName}</small></div>
        </Link>
        <button className="admin-sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>
      <nav className="admin-nav" aria-label="Admin navigation">
        {groups.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <span className="admin-nav-label">{group.label}</span>
            {group.items.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link className="admin-nav-item" data-active={active} href={item.href} key={item.href} onClick={() => setOpen(false)}>
                  <Icon size={17} weight={active ? "fill" : "regular"} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="admin-sidebar-footer">
        <Link className="admin-nav-item" href="/" target="_blank"><House size={17} /> View publication</Link>
        <button className="admin-nav-item" type="button" onClick={logout}><SignOut size={17} /> Sign out</button>
      </div>
    </>
  );

  return (
    <div className="admin-frame">
      <aside className="admin-sidebar">{sidebar}</aside>
      <AnimatePresence>
        {open ? (
          <>
            <motion.button className="admin-mobile-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside className="admin-sidebar admin-sidebar-mobile" initial={reduce ? false : { x: "-100%" }} animate={{ x: 0 }} exit={reduce ? undefined : { x: "-100%" }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
              {sidebar}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
      <div className="admin-content-column">
        <header className="admin-topbar">
          <button className="admin-menu-button" type="button" onClick={() => setOpen(true)} aria-label="Open navigation"><List size={19} /></button>
          <div className="admin-topbar-spacer" />
          <ThemeToggle />
          <Link className="button button-primary admin-create-button" href="/admin/editor/new">
            <NotePencil size={16} /> New piece
          </Link>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
