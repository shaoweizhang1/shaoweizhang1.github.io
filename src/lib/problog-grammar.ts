import type { LanguageRegistration } from "shiki";

// Shiki's Prolog grammar stops colouring at a leading probability ("0.6::edge"),
// so every ProbLog fact and annotated disjunction rendered as one flat line.
// This covers the notation the posts use: ProbLog, DeepProbLog's nn/4 and
// DeepStochLog's grammar rules (→ and -->), plus query output lines.
export const problog: LanguageRegistration = {
  name: "problog",
  scopeName: "source.problog",
  patterns: [
    { name: "comment.line.percentage.problog", match: "%.*$" },
    { name: "string.quoted.double.problog", match: '"[^"]*"' },
    { name: "string.quoted.single.problog", match: "'[^']*'" },
    // A terminal written as a phrase, e.g. [meows at 4am], reads as one string, not as atoms.
    { name: "string.unquoted.terminal.problog", match: "\\[[a-z][^\\[\\],]*\\s[^\\[\\],]*\\]" },
    { name: "support.function.builtin.problog", match: "\\bnn(?=\\()" },
    { name: "keyword.operator.problog", match: "::|:-|<-|-->|→|\\\\\\+|\\bis\\b|;" },
    { name: "entity.name.tag.variable.problog", match: "\\b[A-Z_][A-Za-z0-9_]*\\b" },
    { name: "entity.name.function.problog", match: "\\b[a-z][A-Za-z0-9_]*(?=\\()" },
    { name: "constant.numeric.problog", match: "\\b\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?\\b" },
    { name: "constant.language.problog", match: "\\b[a-z][A-Za-z0-9_]*\\b" },
  ],
  repository: {},
};
