"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// On /reading-notes this pointed at the page it was already on. Rendered as
// plain text there instead — the page already announces itself, and a link
// that does nothing is worse than no link.
export function PostsLink() {
  const pathname = usePathname();

  if (pathname === "/reading-notes") {
    return (
      <span className="pointer-events-auto text-sm text-foreground/40">
        Reading Notes
      </span>
    );
  }

  return (
    <Link
      href="/reading-notes"
      className="pointer-events-auto text-sm text-foreground/60 underline decoration-foreground/30 underline-offset-4 hover:text-foreground hover:decoration-foreground"
    >
      Reading Notes
    </Link>
  );
}
