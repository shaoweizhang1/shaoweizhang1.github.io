import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { TagLink } from "@/components/tag-link";

// One anchor over title and summary: as two separate links to the same URL
// they cost two tab stops per post and a screen reader announced both. The
// date is pinned rather than a flex sibling of the title, because as a
// sibling it has to sit outside that anchor — and below sm the 77px it took
// out of a 400px column wrapped the title to three lines, two of them
// running short against an empty right edge. Tag links stay outside the
// anchor: nested <a> elements aren't valid HTML.
export function PostListItem({ post }: { post: PostMeta }) {
  return (
    <li className="relative">
      <time
        dateTime={post.date}
        className="text-sm text-foreground/40 sm:absolute sm:right-0 sm:top-1"
      >
        {post.date}
      </time>
      <Link href={`/reading-notes/${post.slug}`} className="group block">
        <h2 className="text-lg font-medium group-hover:underline sm:pr-24">
          {post.title}
        </h2>
        {post.summary && (
          <p className="mt-1 text-sm text-foreground/60 group-hover:text-foreground/80">
            {post.summary}
          </p>
        )}
      </Link>
      {post.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <TagLink key={tag} tag={tag} />
          ))}
        </div>
      )}
    </li>
  );
}
