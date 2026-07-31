import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { TrustStrip } from "@/components/listings/trust-strip";
import {
  BLOG_POSTS,
  blogPostSlugs,
  formatBlogDate,
  getBlogPost,
} from "@/domain/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <p className="text-sm font-semibold text-[var(--color-on-surface-muted)]">
          <Link href="/blog" className="hover:text-[var(--color-primary)]">
            Blog
          </Link>
          <span aria-hidden="true"> / </span>
          {post.eyebrow}
        </p>
        <p className="eyebrow mt-4 text-[var(--color-accent)]">
          {post.eyebrow} · {formatBlogDate(post.publishedAt)} ·{" "}
          {post.readMinutes} min read
        </p>
        <h1 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--color-on-surface-muted)]">
          {post.description}
        </p>
        <TrustStrip className="mt-4" />

        <div className="mt-10 space-y-8">
          {post.sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="display-title text-xl text-[var(--color-primary)]">
                {i + 1}. {section.heading}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--color-on-surface-muted)]">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 surface-card space-y-4 p-6">
          <p className="eyebrow text-[var(--color-accent)]">Next step</p>
          <p className="display-title text-2xl text-[var(--color-primary)]">
            Ready to continue?
          </p>
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            Free trial first for parents — tutors apply and publish on the
            marketplace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={post.ctaHref} className="btn-panel btn-panel-primary">
              {post.ctaLabel}
            </Link>
            <Link href="/blog" className="btn-panel btn-panel-secondary">
              More posts
            </Link>
          </div>
        </div>

        {others.length > 0 ? (
          <section className="mt-12">
            <p className="eyebrow text-[var(--color-accent)]">More from the blog</p>
            <ul className="mt-4 space-y-2">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </MarketingShell>
  );
}
