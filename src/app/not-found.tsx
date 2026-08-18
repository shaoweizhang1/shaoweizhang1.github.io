import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-6 py-16 sm:py-24">
      <h1 className="text-lg font-medium">Page not found</h1>
      <p className="text-sm text-foreground/60">
        Nothing at this address. Try the{" "}
        <Link
          href="/reading-notes"
          className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
        >
          reading notes
        </Link>{" "}
        or the{" "}
        <Link
          href="/"
          className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
        >
          homepage
        </Link>
        .
      </p>
    </div>
  );
}
