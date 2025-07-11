import { CommentType, Decoration } from "./types";

export const COMMENT_TYPES: CommentType[] = [
  {
    label: "issue",
    description: "A problem or bug.",
    decorations: ["(non-blocking)", "(blocking)", "(if-minor)"],
  },
  {
    label: "question",
    description: "A question about the code.",
    decorations: ["(blocking)"],
  },
  {
    label: "suggestion",
    description: "A suggestion for improvement.",
    decorations: ["(if-minor)"],
  },
  {
    label: "praise",
    description: "Praise for well-written code.",
    decorations: [],
  },
  {
    label: "nitpick",
    description: "A minor, non-critical style issue.",
    decorations: ["(if-minor)"],
  },
  {
    label: "thought",
    description: "A thought or exploration of an idea.",
    decorations: [],
  },
  {
    label: "chore",
    description: "A routine task or maintenance.",
    decorations: ["(if-minor)"],
  },
];

export const DECORATIONS: Decoration[] = [
  { label: "none", description: "Do not add any decoration." },
  {
    label: "(non-blocking)",
    description: "Should not prevent the subject from being accepted.",
  },
  {
    label: "(blocking)",
    description:
      "Should prevent the subject from being accepted until resolved.",
  },
  {
    label: "(if-minor)",
    description: "Resolve only if the changes end up being minor or trivial.",
  },
];
