import type { Metadata } from "next";
import "./globals.css";
import { PostsLink } from "@/components/posts-link";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Shaowei Zhang",
  description: "Paper notes and research thoughts",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="relative min-h-full flex flex-col">
        {/* Aligned to the right edge of the article column, not the right
            edge of the viewport: every page centres its content in the
            same max-w-2xl px-6 grid, and hugging the window instead left
            a 300px gap between the text and these controls on a wide
            screen. The full-width wrapper only exists to re-create that
            grid, so it stays click-through and the controls opt back in.

            Absolute rather than fixed, so it scrolls away: sitting over
            the column, a transparent fixed bar would print itself on top
            of whatever paragraph happened to scroll under it. */}
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10">
          <div className="mx-auto flex max-w-2xl items-center justify-end gap-4 px-6">
            <PostsLink />
            <div className="pointer-events-auto">
              <ThemeToggle />
            </div>
          </div>
        </div>
        {children}
        <footer className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 pb-10 pt-16 text-sm text-foreground/40">
          {/* No year: under output: "export" it would freeze at whatever
              year the last build ran in, and go quietly wrong in January. */}
          <span>© Shaowei Zhang</span>
          <span className="flex gap-4">
            <a
              href="https://github.com/shaoweizhang1"
              className="underline decoration-foreground/20 underline-offset-4 hover:text-foreground/70 hover:decoration-foreground/50"
            >
              GitHub
            </a>
            <a
              href="mailto:shaowei.zhang@stud.uni-heidelberg.de"
              className="underline decoration-foreground/20 underline-offset-4 hover:text-foreground/70 hover:decoration-foreground/50"
            >
              Email
            </a>
          </span>
        </footer>
      </body>
    </html>
  );
}
