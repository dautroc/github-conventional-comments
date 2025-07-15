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

export function insertSnippet(activeEditor: HTMLTextAreaElement | HTMLElement, snippet: string, triggerIndex?: number): void {
  const { text, cursorPosition } = getEditorState(activeEditor);

  const match = text.match(/^\*\*.*:\**/);
  const snippetRange = {
    start: 0,
    end: match ? match[0].length : 0
  }
  if (match && /\s/.test(text.charAt(match[0].length))) snippet = snippet.trim()

  const textareaElement = activeEditor as HTMLTextAreaElement;
  triggerIndex = triggerIndex ?? cursorPosition;

  textareaElement.focus();
  textareaElement.setSelectionRange(cursorPosition, cursorPosition)

  const validateCmd = document.execCommand('insertText', false, '');
  if (validateCmd) {
    if (triggerIndex !== cursorPosition) {
      textareaElement.setSelectionRange(triggerIndex, cursorPosition);
      document.execCommand('delete', false);
    }
    textareaElement.setSelectionRange(snippetRange.start, snippetRange.end)
    document.execCommand('insertText', false, snippet);
  } else {
    // Fallback for browsers that do not support execCommand
    const textBefore = text.substring(snippetRange.end, triggerIndex);
    const textAfter = text.substring(cursorPosition);
    textareaElement.value = snippet + textBefore + textAfter;

    const newCursorPos = snippet.length;
    textareaElement.setSelectionRange(newCursorPos, newCursorPos, "forward");
  }

  textareaElement.scrollTop = 0;
  textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
}

export function generateSnippet(type: string, decorator: Decorator): string {
  return !decorator.length || decorator === Decorator.NONE ? `**${type}:** ` : `**${type} ${decorator}:** `;
}

export function commentTypesInjected(text: string): boolean {
  return COMMENT_TYPES.some(({ label }) => text.startsWith(`**${label}`));
}

export function handleGlobalListener<T extends Event>(e: T, executor: (_: T) => void): void {
  const target = e.target as HTMLElement;
  if (target && !target.isContentEditable) executor(e);
}
