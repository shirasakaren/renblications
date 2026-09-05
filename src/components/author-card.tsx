import { createHash } from "node:crypto";
import type { AuthorProfile } from "@/lib/types";

function profileImage(profile: AuthorProfile): string {
  if (profile.avatarUrl) return profile.avatarUrl;
  if (!profile.gravatarEmail) return "";
  const hash = createHash("md5").update(profile.gravatarEmail.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=404&s=640`;
}

export function AuthorCard({ profile }: { profile: AuthorProfile }) {
  const image = profileImage(profile);
  return (
    <section className="author-panel" aria-label="About the author">
      {image ? (
        // User-controlled sources cannot be known at build time, so this intentionally bypasses next/image host allowlists.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="author-portrait" src={image} alt={profile.name} />
      ) : (
        <div className="author-fallback" aria-hidden="true">
          {profile.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="author-copy">
        <h2>{profile.name}</h2>
        <p>{profile.bio}</p>
        {profile.links.length ? (
          <div className="author-links">
            {profile.links.map((link) => (
              <a href={link.url} key={link.url} rel="me noreferrer" target="_blank">
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
