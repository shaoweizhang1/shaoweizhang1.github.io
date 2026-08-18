import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { PostListItem } from "@/components/post-list-item";

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col gap-8 px-6 py-16 sm:py-24">
      <Link
        href="/"
        className="text-sm text-foreground/50 hover:text-foreground/80"
      >
        ← Home
      </Link>
      <h1 className="text-sm font-medium uppercase tracking-wider text-foreground/50">
        Reading Notes
      </h1>
      <ul className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostListItem key={post.slug} post={post} />
        ))}
      </ul>
    </div>
  );
}
