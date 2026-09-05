import Link from "next/link";

export function SiteFooter({ name, note }: { name: string; note: string }) {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <span>{note}</span>
        <span>
          {name} {new Date().getFullYear()} · <Link href="/admin">Admin</Link>
        </span>
      </div>
    </footer>
  );
}
