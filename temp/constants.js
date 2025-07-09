"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECORATIONS = exports.COMMENT_TYPES = void 0;
exports.COMMENT_TYPES = [
    { label: "praise", description: "Highlights something positive." },
    { label: "nitpick", description: "A minor, non-critical issue." },
    { label: "suggestion", description: "Suggests a specific improvement." },
    {
        label: "issue",
        description: "Highlights a problem with the subject under review.",
    },
    { label: "todo", description: "A small, trivial, but necessary change." },
    { label: "question", description: "Asks for clarification." },
    {
        label: "thought",
        description: "Represents an idea that popped up from reviewing.",
    },
    {
        label: "chore",
        description: 'A simple task that must be done before the subject can be "officially" accepted.',
    },
    {
        label: "note",
        description: "Highlights something the reader should take note of.",
    },
];
exports.DECORATIONS = [
    { label: "none", description: "Do not add any decoration." },
    {
        label: "(non-blocking)",
        description: "Should not prevent the subject from being accepted.",
    },
    {
        label: "(blocking)",
        description: "Should prevent the subject from being accepted until resolved.",
    },
    {
        label: "(if-minor)",
        description: "Resolve only if the changes end up being minor or trivial.",
    },
];
