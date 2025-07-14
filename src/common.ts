import { COMMENT_TYPES } from "./constants";
import { Decorator, EditorState } from "./types";

export function getEditorState(
  editor: HTMLTextAreaElement | HTMLElement
): EditorState {
  if (!editor) return { text: "", cursorPosition: 0 };

  if (editor.isContentEditable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return {
        text: editor.textContent || "",
        cursorPosition: editor.textContent?.length || 0,
      };
    }
    const range = selection.getRangeAt(0);
    return {
      text: editor.textContent || "",
      cursorPosition: range.startOffset,
    };
  } else {
    const textareaElement = editor as HTMLTextAreaElement;
    return {
      text: textareaElement.value,
      cursorPosition: textareaElement.selectionStart,
    };
  }
}

export function generateSnippet(type: string, decorator: Decorator): string {
  return !decorator.length || decorator === Decorator.NONE ? `**${type}:** ` : `**${type} ${decorator}:** `;
}

export function commentTypesInjected(text: string): boolean {
  return COMMENT_TYPES.some(({ label }) => text.startsWith(`**${label}`));
}
