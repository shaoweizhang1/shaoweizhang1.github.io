"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/posts";

// How far down the viewport a heading has to scroll before we consider
// it "reached" — roughly a third down, so a section counts as current
// once it's clearly in reading position, not the instant its top pixel
// appears at the very bottom of the screen.
const ACTIVE_LINE_FRACTION = 0.3;

export function ReadingProgress({ headings }: { headings: Heading[] }) {
  // -1 is "no section reached yet", which is where every post starts: the
  // intro sits above the first heading, and marking that heading read
  // while the reader is still above it is a lie about their position.
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (headings.length === 0) return;

    function onScroll() {
      const threshold = window.innerHeight * ACTIVE_LINE_FRACTION;
      let current = -1;
      for (let i = 0; i < headings.length; i++) {
        const el = document.getElementById(headings[i].id);
        if (el && el.getBoundingClientRect().top <= threshold) {
          current = i;
        }
      }
      setActiveIndex(current);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    // Anchored to the article column rather than the window: the column is
    // max-w-2xl (42rem) centred, so its left edge is at 50% - 21rem, and
    // -translate-x-full hangs the whole nav off that edge with pr-8 as the
    // gutter. Pinning it to the viewport instead put it 400px away from the
    // text it indexes on a wide screen — and, worse, overlapped the column
    // at exactly the width the xl breakpoint let it appear.
    <nav
      aria-label="Reading progress"
      className="fixed left-[calc(50%-21rem)] top-1/2 hidden -translate-x-full -translate-y-1/2 pr-8 xl:block"
    >
      <ol className="flex flex-col gap-4">
        {headings.map((h, i) => {
          const read = i <= activeIndex;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                title={h.text}
                className="flex items-center gap-3"
              >
                <span
                  aria-hidden="true"
                  className={`shrink-0 rounded-full transition-all duration-300 ${
                    read
                      ? "h-[3px] w-6 bg-foreground"
                      : "h-px w-6 bg-foreground/30"
                  }`}
                />
                {/* Capped and ellipsised: a long section title would
                    otherwise widen the nav past the gutter and back under
                    the article column. Full text stays available as the
                    link's title attribute. */}
                <span
                  className={`max-w-[13rem] truncate text-xs transition-colors duration-300 ${
                    read ? "text-foreground" : "text-foreground/40"
                  }`}
                >
                  {h.text}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
