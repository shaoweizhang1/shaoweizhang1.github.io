"use client";

import { useEffect } from "react";

// A side-by-side pair whose code does not fit its half is stacked instead of
// scrolling sideways. Measured after fonts load and on every resize, because
// whether a line fits depends on both.
export function CodeCompareFit() {
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(".code-compare"));
    const fit = () => {
      for (const block of blocks) {
        block.classList.remove("code-compare-stacked");
        const overflows = Array.from(block.querySelectorAll("pre")).some(
          (pre) => pre.scrollWidth > pre.clientWidth,
        );
        block.classList.toggle("code-compare-stacked", overflows);
      }
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return null;
}
