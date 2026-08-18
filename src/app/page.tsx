import { getAllTags } from "@/lib/tags";
import { ExploreByTopic } from "@/components/explore-by-topic";

export default function Home() {
  const topics = getAllTags();

  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col gap-16 px-6 py-16 sm:py-24">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          Shaowei Zhang
        </h1>
        <p className="mt-3 text-base leading-relaxed text-foreground/70">
          M.A. student in Computational Linguistics at Heidelberg University,
          interested in AI and NLP.
        </p>
        <p className="mt-2 text-base leading-relaxed text-foreground/70">
          Notes on papers I read, research thoughts, and reproductions.
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <a
            href="https://github.com/shaoweizhang1"
            className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
          >
            GitHub
          </a>
          <a
            href="mailto:shaowei.zhang@stud.uni-heidelberg.de"
            className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
          >
            Email
          </a>
          <a
            href="/cv.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
          >
            CV
          </a>
        </div>
      </section>

      <ExploreByTopic topics={topics} />
    </div>
  );
}
