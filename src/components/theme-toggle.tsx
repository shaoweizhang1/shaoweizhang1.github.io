"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-full border border-foreground/15 px-3.5 py-1.5 text-sm text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
