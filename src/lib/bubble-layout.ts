import type { Topic } from "./tags";
import { hueForIndex } from "./topic-colors";

export type SizedTopic = Topic & {
  /** Bubble diameter in px. */
  size: number;
  /** Hue 0-360, see topic-colors.ts. */
  hue: number;
};

/** Diameter of a topic with a single post. */
export const BASE_BUBBLE_SIZE = 80;
/** Each post after the first adds this fraction of the base diameter. */
export const GROWTH_PER_POST = 0.2;
/** Hard ceiling — the field is only 280px tall. Reached at 4 posts. */
export const MAX_BUBBLE_SIZE = 132;

// Diameter is a direct read of post count: one post is the base size, every
// further post adds 20% of it. Deliberately not normalised against the
// largest topic — that made the smallest bubble tiny and the largest huge
// no matter whether the gap between them was one post or fifty, and made
// every bubble identical whenever the counts happened to be level.
//
// The base size is set by the longest label rather than by taste: every
// bubble uses the same type size, so the smallest circle still has to hold
// the widest run of characters that can't be broken across lines — either
// a whole name ("deepproblog") or the longest piece a hyphenated one
// splits into ("programming"). Both are 11 characters, which is what 80px
// buys at 11px type. A longer name than that needs this raised, not the
// name mangled.
function diameterFor(count: number): number {
  const size = BASE_BUBBLE_SIZE * (1 + GROWTH_PER_POST * (count - 1));
  return Math.round(Math.min(size, MAX_BUBBLE_SIZE));
}

export function sizeTopics(topics: Topic[]): SizedTopic[] {
  // Hue comes from position in a stable ordering, not from the topic's own
  // name, so the set is spread across the colour wheel instead of clumping.
  const order = [...topics]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((t) => t.slug);

  return topics.map((t) => ({
    ...t,
    size: diameterFor(t.count),
    hue: hueForIndex(order.indexOf(t.slug)),
  }));
}
