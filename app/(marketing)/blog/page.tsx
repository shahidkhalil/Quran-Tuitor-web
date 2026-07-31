import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { TrustStrip } from "@/components/listings/trust-strip";
import { BLOG_POSTS, formatBlogDate } from "@/domain/blog";

export const metadata = {
  title: "Blog",
  description:
    "Articles on platform payments, free trials, weekly Quran habits, tutor media, and teaching online with Quran Tutor.",
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <p className="eyebrow text-[var(--color-accent)]">Insights</p>
        <h1 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
          Blog
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--color-on-surface-muted)]">
          Practical posts for parents and tutors — trust, trials, habits, and
          how the marketplace works — then browse verified teachers.
        </p>
        <TrustStrip className="mt-4" />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="surface-card surface-card-interactive block h-full p-5"
              >
                <p className="eyebrow text-[var(--color-accent)]">
                  {post.eyebrow} · {formatBlogDate(post.publishedAt)} ·{" "}
                  {post.readMinutes} min
                </p>
                <h2 className="display-title mt-2 text-xl text-[var(--color-primary)]">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--color-on-surface-muted)]">
                  {post.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-[var(--color-primary)]">
                  Read post →
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/browse" className="btn-panel btn-panel-primary">
            Browse tutors
          </Link>
          <Link href="/guides" className="btn-panel btn-panel-secondary">
            Parent guides
          </Link>
        </div>
      </main>
    </MarketingShell>
  );
}
