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

function checkIfGithubPullRequest() {
  if (!window || !window.location) return false;
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  const isGitHub = hostname === "github.com" || hostname.includes("github");
  const isPullRequest = /\/[^\/]+\/[^\/]+\/pull\/\d+/.test(pathname);

  return isGitHub && isPullRequest;
}

function isCommentTextarea(element: HTMLElement): boolean {
  // Check if the element is a textarea
  if (element.tagName.toLowerCase() !== "textarea") return false;
  
  // Exclude copilot chat textarea
  if (element.id === 'copilot-chat-textarea') return false;
  
  // Exclude PR description and title edit areas specifically
  if (element.name === "pull_request[body]" || 
      element.name === "pull_request[title]" ||
      element.id === "pull_request_body" ||
      element.id === "pull_request_title") {
    return false;
  }
  
  // Exclude PR description forms by checking if it's in a previewable comment form
  // but only if it's specifically for PR/issue body editing
  const previewableForm = element.closest('.js-previewable-comment-form');
  if (previewableForm) {
    // Check if this is specifically a PR/issue body edit form
    if (previewableForm.querySelector('[name="pull_request[body]"]') ||
        previewableForm.querySelector('[name="issue[body]"]') ||
        previewableForm.closest('.js-issue-update')) {
      return false;
    }
  }
  
  // For all other textareas on GitHub PR pages, allow them
  // This is more permissive but we'll rely on the specific exclusions above
  return true;
}

export function handleGlobalListener<T extends Event>(e: T, executor: (_: T) => void): void {
  if (!checkIfGithubPullRequest()) return;
  
  const target = e.target as HTMLElement;

  if (!target) return;

  // Only proceed if the target is a comment textarea
  if (!isCommentTextarea(target)) return;

  executor(e);
}
