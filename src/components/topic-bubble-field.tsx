"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type { Topic } from "@/lib/tags";
import { sizeTopics, type SizedTopic } from "@/lib/bubble-layout";

type Body = {
  el: HTMLAnchorElement | null;
  radius: number;
  mass: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function notesLabel(count: number): string {
  return `${count} ${count === 1 ? "note" : "notes"}`;
}

// Tuning constants for the ambient float: gentle enough to feel calm and
// "premium" rather than a bouncing-ball demo. All rates are per second so
// motion stays consistent regardless of frame rate.
const CENTER_PULL = 0.02; // spring toward container center, keeps the cluster together
const DAMPING = 0.15; // fraction of velocity bled off per second
const JITTER = 3; // px/s^2 of random wander, keeps motion from ever fully settling
const RESTITUTION = 0.85; // collision bounciness (1 = perfectly elastic)
const MAX_SPEED = 22; // px/s cap
const WALL_PADDING = 1;

export function TopicBubbleField({ topics }: { topics: Topic[] }) {
  const sized = useMemo(() => sizeTopics(topics), [topics]);
  const containerRef = useRef<HTMLDivElement>(null);
  const elRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container || sized.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const rect = container.getBoundingClientRect();

    const bodies: Body[] = sized.map((topic: SizedTopic) => {
      // Plain Math.random() on purpose: this only runs client-side after
      // mount, so a different starting arrangement on every page visit is
      // fine (no SSR/hydration mismatch risk) and is what makes the field
      // feel alive rather than resetting to the same spot every time.
      const radius = topic.size / 2;
      const x = radius + Math.random() * Math.max(1, rect.width - topic.size);
      const y = radius + Math.random() * Math.max(1, rect.height - topic.size);
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      return {
        el: elRefs.current.get(topic.slug) ?? null,
        radius,
        mass: radius * radius,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
    });

    const paint = () => {
      for (const b of bodies) {
        b.el?.style.setProperty(
          "transform",
          `translate3d(${(b.x - b.radius).toFixed(1)}px, ${(b.y - b.radius).toFixed(1)}px, 0)`,
        );
      }
    };
    paint();

    if (reduceMotion) return;

    let raf = 0;
    let last = performance.now();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const { width, height } = container!.getBoundingClientRect();
      const cx = width / 2;
      const cy = height / 2;
      const damp = Math.max(0, 1 - DAMPING * dt);

      for (const b of bodies) {
        b.vx += (cx - b.x) * CENTER_PULL * dt;
        b.vy += (cy - b.y) * CENTER_PULL * dt;
        b.vx += (Math.random() - 0.5) * JITTER * dt;
        b.vy += (Math.random() - 0.5) * JITTER * dt;

        b.vx *= damp;
        b.vy *= damp;

        const speed = Math.hypot(b.vx, b.vy);
        if (speed > MAX_SPEED) {
          b.vx = (b.vx / speed) * MAX_SPEED;
          b.vy = (b.vy / speed) * MAX_SPEED;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      for (const b of bodies) {
        if (b.x - b.radius < WALL_PADDING) {
          b.x = b.radius + WALL_PADDING;
          b.vx = Math.abs(b.vx) * RESTITUTION;
        } else if (b.x + b.radius > width - WALL_PADDING) {
          b.x = width - b.radius - WALL_PADDING;
          b.vx = -Math.abs(b.vx) * RESTITUTION;
        }
        if (b.y - b.radius < WALL_PADDING) {
          b.y = b.radius + WALL_PADDING;
          b.vy = Math.abs(b.vy) * RESTITUTION;
        } else if (b.y + b.radius > height - WALL_PADDING) {
          b.y = height - b.radius - WALL_PADDING;
          b.vy = -Math.abs(b.vy) * RESTITUTION;
        }
      }

      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const minDist = a.radius + b.radius;
          if (dist >= minDist) continue;

          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          const totalMass = a.mass + b.mass;

          a.x -= nx * overlap * (b.mass / totalMass);
          a.y -= ny * overlap * (b.mass / totalMass);
          b.x += nx * overlap * (a.mass / totalMass);
          b.y += ny * overlap * (a.mass / totalMass);

          const avn = a.vx * nx + a.vy * ny;
          const bvn = b.vx * nx + b.vy * ny;
          const aNewVn = ((a.mass - b.mass) * avn + 2 * b.mass * bvn) / totalMass;
          const bNewVn = ((b.mass - a.mass) * bvn + 2 * a.mass * avn) / totalMass;

          a.vx += (aNewVn - avn) * nx * RESTITUTION;
          a.vy += (aNewVn - avn) * ny * RESTITUTION;
          b.vx += (bNewVn - bvn) * nx * RESTITUTION;
          b.vy += (bNewVn - bvn) * ny * RESTITUTION;
        }
      }

      paint();
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sized]);

  return (
    <div
      ref={containerRef}
      className="relative h-[280px] w-full overflow-hidden sm:h-[320px]"
    >
      <ul className="contents">
        {sized.map((bubble) => (
          <li key={bubble.slug} className="contents">
            <Link
              ref={(el) => {
                if (el) elRefs.current.set(bubble.slug, el);
                else elRefs.current.delete(bubble.slug);
              }}
              href={`/tags/${bubble.slug}`}
              title={notesLabel(bubble.count)}
              aria-label={`${bubble.name}, ${notesLabel(bubble.count)}`}
              className="topic-bubble group absolute z-0 flex items-center justify-center rounded-full text-center text-foreground/80 backdrop-blur-[2px] transition-[background-color,border-color,box-shadow] duration-300 hover:z-20 hover:text-foreground focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              style={
                {
                  width: bubble.size,
                  height: bubble.size,
                  "--hue": bubble.hue,
                } as CSSProperties
              }
            >
              {/* One type size for every bubble — the circles are sized to
                  fit the longest label, not the type to fit the circle.
                  break-words is the backstop for a topic name with no
                  hyphen to wrap at. */}
              <span className="pointer-events-none px-1 text-[11px] leading-tight break-words">
                {bubble.name}
              </span>
              <span
                className="pointer-events-none absolute bottom-0 translate-y-full whitespace-nowrap rounded-full border border-foreground/15 bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-foreground/10"
                aria-hidden="true"
              >
                {notesLabel(bubble.count)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
