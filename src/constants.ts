import { CommentType, Decoration, Decorator, } from "./types";

export const COMMENT_TYPES: CommentType[] = [
  {
    label: "Issue",
    description: "A problem or bug.",
    decorations: [Decorator.NONE, Decorator.BLOCKING, Decorator.NON_BLOCKING, Decorator.IF_MINOR],
  },
  {
    label: "Question",
    description: "A question about the code.",
    decorations: [Decorator.NONE, Decorator.BLOCKING, Decorator.NON_BLOCKING],
  },
  {
    label: "Suggestion",
    description: "A suggestion for improvement.",
    decorations: [Decorator.NONE, Decorator.BLOCKING, Decorator.NON_BLOCKING, Decorator.IF_MINOR],
  },
  {
    label: "Nitpick",
    description: "A minor, non-critical style issue.",
    decorations: [],
  },
  {
    label: "Thought",
    description: "A thought or exploration of an idea.",
    decorations: [],
  },
  {
    label: "Todo",
    description: "An item needs to be done next.",
    decorations: [],
  },
  {
    label: "Note",
    description: "Highlight or remind something.",
    decorations: [],
  },
  {
    label: "Praise",
    description: "Praise for well-written code.",
    decorations: [],
  },
  {
    label: "Chore",
    description: "A routine task or maintenance.",
    decorations: [Decorator.NONE, Decorator.IF_MINOR],
  },
];

export const DECORATIONS: Decoration[] = [
  { label: Decorator.NONE, description: "Do not add any decoration." },
  {
    label: Decorator.NON_BLOCKING,
    description: "Should not prevent the subject from being accepted.",
  },
  {
    label: Decorator.BLOCKING,
    description:
      "Should prevent the subject from being accepted until resolved.",
  },
  {
    label: Decorator.IF_MINOR,
    description: "Resolve only if the changes end up being minor or trivial.",
  },
];
