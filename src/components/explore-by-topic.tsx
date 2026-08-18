import type { Topic } from "@/lib/tags";
import { TopicBubbleField } from "./topic-bubble-field";

export function ExploreByTopic({ topics }: { topics: Topic[] }) {
  if (topics.length === 0) return null;

  return (
    <section aria-labelledby="explore-by-topic-heading">
      <h2
        id="explore-by-topic-heading"
        className="text-sm font-medium uppercase tracking-wider text-foreground/50"
      >
        Reading Notes by Topic
      </h2>

      <div className="mt-6">
        <TopicBubbleField topics={topics} />
      </div>
    </section>
  );
}
