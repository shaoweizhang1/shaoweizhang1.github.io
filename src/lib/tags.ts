import { getAllPosts, type PostMeta } from "./posts";
import { slugify } from "./slug";

export type Topic = {
  name: string;
  slug: string;
  count: number;
};

// All tags across published posts, deduplicated by normalized slug so
// e.g. "NLP" and "nlp" merge into one entry. The display name keeps the
// casing from wherever the tag was first written, so authors control it
// just by how they type the tag.
export function getAllTags(): Topic[] {
  const posts = getAllPosts();
  const bySlug = new Map<string, { name: string; count: number }>();

  for (const post of posts) {
    for (const raw of post.tags) {
      const tag = raw.trim();
      if (!tag) continue;
      const slug = slugify(tag);
      if (!slug) continue;
      const existing = bySlug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(slug, { name: tag, count: 1 });
      }
    }
  }

  return Array.from(bySlug.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getPostsByTagSlug(slug: string): PostMeta[] {
  return getAllPosts().filter((post) =>
    post.tags.some((tag) => slugify(tag) === slug),
  );
}
