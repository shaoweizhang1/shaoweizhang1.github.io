import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTagSlug } from "@/lib/tags";
import { PostListItem } from "@/components/post-list-item";

export function generateStaticParams() {
  return getAllTags().map((topic) => ({ slug: topic.slug }));
}

export default function TagPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const topic = getAllTags().find((t) => t.slug === slug);

  if (!topic) notFound();

  const posts = getPostsByTagSlug(slug);

  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col gap-8 px-6 py-16 sm:py-24">
      <Link
        href="/#explore-by-topic-heading"
        className="text-sm text-foreground/50 hover:text-foreground/80"
      >
        ← All topics
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {topic.name}
        </h1>
        <p className="mt-2 text-sm text-foreground/50">
          {topic.count} {topic.count === 1 ? "note" : "notes"}
        </p>
      </header>

      <ul className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostListItem key={post.slug} post={post} />
        ))}
      </ul>
    </div>
  );
}
