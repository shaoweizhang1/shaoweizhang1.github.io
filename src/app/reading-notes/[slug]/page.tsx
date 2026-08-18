import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { ReadingProgress } from "@/components/reading-progress";
import { TagLink } from "@/components/tag-link";
import "katex/dist/katex.min.css";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// Without this every post shares the site-wide title and description from
// the root layout, so all three link previews came out identical.
export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getAllPosts().find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) notFound();

  return (
    <article className="mx-auto flex max-w-2xl flex-1 flex-col gap-8 px-6 py-16 sm:py-24">
      <ReadingProgress headings={post.headings} />
      <Link
        href="/"
        className="text-sm text-foreground/50 hover:text-foreground/80"
      >
        ← Home
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {post.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground/50">
          <time>{post.date}</time>
          {post.tags.map((tag) => (
            <TagLink key={tag} tag={tag} />
          ))}
        </div>

        {/* Rendered from frontmatter rather than typed into the body, so
            the citation reads the same on every post and the link can't
            quietly go missing. */}
        {post.paper && (
          <p className="mt-4 text-sm leading-relaxed text-foreground/60">
            Paper: {post.paper.authors} ({post.paper.year}).{" "}
            <a
              href={post.paper.url}
              target="_blank"
              rel="noreferrer"
              className="italic underline decoration-foreground/30 underline-offset-4 hover:text-foreground hover:decoration-foreground"
            >
              {post.paper.title}
            </a>
            {post.paper.venue ? `. ${post.paper.venue}.` : "."}
          </p>
        )}
      </header>

      <div
        className="prose prose-neutral max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  );
}
