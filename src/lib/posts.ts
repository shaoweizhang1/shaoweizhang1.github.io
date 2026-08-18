import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import GithubSlugger from "github-slugger";

const postsDirectory = path.join(process.cwd(), "content/reading_notes");

// The paper a post is about. Structured rather than written out in the
// body, so "every paper post links its paper" is something the build can
// check (see readPaper) instead of something I have to remember.
export type PaperRef = {
  title: string;
  authors: string;
  year: number;
  venue?: string;
  url: string;
};

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  paper?: PaperRef;
};

// A `paper` block with no url is the one mistake worth failing the build
// over: the post still renders, just silently without the link that every
// paper post is supposed to carry.
function readPaper(slug: string, data: Record<string, unknown>): PaperRef | undefined {
  const paper = data.paper as PaperRef | undefined;
  if (!paper) return undefined;
  if (!paper.url) {
    throw new Error(`${slug}: frontmatter has a "paper" block with no "url"`);
  }
  return paper;
}

function readSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

// Published posts only: a post is excluded if its frontmatter sets
// `draft: true`. Everything that reads posts (homepage list, tag counts,
// static params) goes through this one function so drafts stay out of
// all of them consistently.
export function getAllPosts(): PostMeta[] {
  return readSlugs()
    .flatMap((slug) => {
      const fullPath = path.join(postsDirectory, `${slug}.md`);
      const { data } = matter(fs.readFileSync(fullPath, "utf8"));
      if (data.draft) return [];
      return [
        {
          slug,
          title: data.title ?? slug,
          date: data.date ?? "",
          tags: data.tags ?? [],
          summary: data.summary ?? "",
          paper: readPaper(slug, data),
        },
      ];
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export type Heading = {
  id: string;
  text: string;
};

export type Post = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  paper?: PaperRef;
  contentHtml: string;
  headings: Heading[];
};

// Section headings (## only) for the reading-progress nav, extracted
// straight from the markdown source rather than the rendered tree —
// our posts only ever use "##" within the body (the post title is its
// own separate h1 outside contentHtml), so a line-level regex is enough
// and avoids a second AST walk. Slugged with the same library rehypeSlug
// uses internally, in the same top-to-bottom order, so these ids match
// the ones actually landing in the HTML (and github-slugger's dedup
// numbering, e.g. a repeated heading becoming "-1", only matches if the
// call order lines up too).
function extractHeadings(content: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  for (const match of content.matchAll(/^##\s+(.+)$/gm)) {
    // Strip any inline HTML: rehypeSlug slugs the rendered *text* of a
    // heading, so leaving the tags in would both print markup in the nav
    // and produce an id that no heading in the page actually has.
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    headings.push({ id: slugger.slug(text), text });
  }
  return headings;
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
  // allowDangerousHtml: posts are all self-authored, no untrusted content,
  // and occasional inline HTML (e.g. a highlighted <span>) is intentional.
  // remarkMath/rehypeKatex render $...$ and $$...$$ as real math instead
  // of leaving the raw LaTeX source in the page. rehypePrettyCode (Shiki)
  // syntax-highlights fenced code blocks with a light/dark theme pair —
  // each token carries both colors as CSS variables, and globals.css
  // switches between them based on the .dark class (see .shiki rules).
  // rehypeSlug adds id="..." to headings so the reading-progress nav
  // (extractHeadings, above) has anchors to link and scroll-track.
  const processed = await unified()
    .use(remarkParse)
    // remark-gfm is here for tables; the results tables in the reproduction
    // notes are markdown, and plain CommonMark has no table syntax.
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: { light: "github-light", dark: "github-dark" },
      defaultLang: "prolog",
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    tags: data.tags ?? [],
    paper: readPaper(slug, data),
    contentHtml: processed.toString(),
    headings: extractHeadings(content),
  };
}
