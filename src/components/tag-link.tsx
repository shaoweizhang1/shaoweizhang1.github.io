import Link from "next/link";
import { slugify } from "@/lib/slug";

// One chip, one place. Both the post header and the list item render the
// same tag links, and they were drifting apart as separate copies of the
// same class string.
//
// Outlined rather than filled: as a gray-on-gray pill these read as
// metadata labels, and nobody could tell they were clickable. A border is
// the cheapest affordance that doesn't add colour the page doesn't
// otherwise use.
export function TagLink({ tag }: { tag: string }) {
  return (
    <Link
      href={`/tags/${slugify(tag)}`}
      className="rounded-full border border-foreground/45 px-2.5 py-0.5 text-xs text-foreground/60 transition-colors hover:border-foreground/70 hover:bg-foreground/5 hover:text-foreground"
    >
      {tag}
    </Link>
  );
}
