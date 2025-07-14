import { generateSnippet, getEditorState } from "./common";
import { COMMENT_TYPES, DECORATIONS } from "./constants";
import { Decorator, Stage } from "./types";

let activeEditor: HTMLTextAreaElement | HTMLElement | null;
let currentStage: Stage;
let observer: MutationObserver | null;
let observedNode: HTMLElement | null;
let buttonBar: HTMLDivElement | null;
let activeForm: HTMLFormElement | null;
let formSubmitHandler: (() => void) | null;
let selectedLabel: string;
let selectedDecoration: string;
let activeEditorWrapper: HTMLDivElement | null;
let snippet: string;

// -- State --
function initState() {
  activeEditor = null;
  currentStage = Stage.INACTIVE;
  observer = null;
  observedNode = null;
  buttonBar = null;
  activeForm = null;
  formSubmitHandler = null;
  selectedLabel = "";
  selectedDecoration = "";
  activeEditorWrapper = null;
  snippet = "";
}

// -- Funtions --
function setupCleanupListeners() {
  if (!activeEditor || !buttonBar) return;

  // 1. Listen for form submission
  const form = activeEditor.closest("form");
  if (form) {
    activeForm = form;
    formSubmitHandler = () => cleanup();
    activeForm.addEventListener("submit", formSubmitHandler);
  }

  // 2. Watch for DOM removal as a fallback
  observedNode = buttonBar.parentElement;
  if (observedNode) {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const removed = Array.from(mutation.removedNodes);
        if (
          (buttonBar && removed.includes(buttonBar)) ||
          (activeEditor && removed.includes(activeEditor))
        ) {
          cleanup();
          return;
        }
      }
    });
    observer.observe(observedNode, { childList: true });
  }
}

function onButtonBarClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!buttonBar) return;

  // Handle breadcrumb click to go back to labels
  if (target.matches(".cc-button.cc-breadcrumb")) {
    selectedDecoration = "";
    renderLabelButtons(buttonBar, selectedLabel);
    return;
  }

  // Handle label click
  if (target.matches(".cc-button[data-label]")) {
    const label = target.dataset.label;
    if (!label) return;

    selectedLabel = label;
    selectedDecoration = ""; // Reset on new label selection
    const commentType = COMMENT_TYPES.find((c) => c.label === label);

    if (commentType?.decorations?.length) {
      renderDecorationButtons(buttonBar, label);
    } else {
      // No decorations, just insert label
      const snippet = generateSnippet(label, Decorator.NONE);
      updateCommentPrefix(snippet);
      renderLabelButtons(buttonBar, selectedLabel); // Re-render with active label
    }
    return;
  }

  // Handle decoration click
  if (target.matches(".cc-button[data-decoration]")) {
    const decoration = target.dataset.decoration;
    if (!decoration || !selectedLabel) return;
    
    selectedDecoration = decoration;
    const snippet = generateSnippet(selectedLabel, selectedDecoration as Decorator);
    updateCommentPrefix(snippet);
    renderDecorationButtons(buttonBar, selectedLabel, selectedDecoration);
    return;
  }
}

function updateCommentPrefix(snippet: string): void {
  if (!activeEditor) {
    return;
  }

  const { text } = getEditorState(activeEditor);
  const prefixRegex = /^\*\*.*:\**/;
  const match = text.match(prefixRegex);

  let newText: string;
  if (match) {
    newText = snippet + text.substring(match[0].length + 1);
  } else {
    newText = snippet + text;
  }

  if (activeEditor.isContentEditable) {
    activeEditor.textContent = newText;
  } else {
    (activeEditor as HTMLTextAreaElement).value = newText;
  }

  // Set cursor position
  const newCursorPos = snippet.length;
  if (activeEditor.isContentEditable) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    const textNode = activeEditor.firstChild || document.createTextNode("");
    if (textNode) {
      range.setStart(
        textNode,
        Math.min(newCursorPos, textNode.textContent?.length || 0)
      );
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } else {
    const textarea = activeEditor as HTMLTextAreaElement;
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;
  }

  activeEditor.focus();
  // We no longer dispatch the event to prevent frameworks from overwriting our changes.
  // activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
}

function cleanup(): void {
  cleanupButtonBar();
  initState();
}

// -- UI --
function createButtonBar(container: HTMLElement): HTMLDivElement {
  const bar = document.createElement("div");
  bar.id = "conventional-comment-button-bar";
  container.appendChild(bar);
  return bar;
}

function renderLabelButtons(
  container: HTMLDivElement,
  activeLabel?: string
): void {
  container.innerHTML = ""; // Clear existing buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "cc-buttons-container";

  COMMENT_TYPES.forEach((type) => {
    const button = document.createElement("button");
    button.className = "cc-button";
    if (type.label === activeLabel) {
      button.classList.add("active");
    }
    button.dataset.label = type.label;
    button.textContent = type.label;
    button.type = "button";
    buttonContainer.appendChild(button);
  });
  container.appendChild(buttonContainer);
}

function renderDecorationButtons(
  container: HTMLDivElement,
  label: string,
  activeDecoration?: string
): void {
  container.innerHTML = ""; // Clear existing buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "cc-buttons-container";

  const commentType = COMMENT_TYPES.find((c) => c.label === label);
  const decorationLabels = commentType?.decorations || [];

  const breadcrumb = document.createElement("button");
  breadcrumb.className = "cc-button cc-breadcrumb";
  breadcrumb.dataset.label = label;
  breadcrumb.textContent = label;
  breadcrumb.type = "button";
  buttonContainer.appendChild(breadcrumb);

  if (decorationLabels.length > 0) {
    const separator = document.createElement("span");
    separator.className = "cc-breadcrumb-separator";
    separator.textContent = ">";
    buttonContainer.appendChild(separator);

    DECORATIONS.filter((d) => decorationLabels.includes(d.label)).forEach(
      (d) => {
        const button = document.createElement("button");
        button.className = "cc-button";
        if (d.label === activeDecoration) {
          button.classList.add("active");
        }
        button.dataset.decoration = d.label;
        button.textContent = d.label;
        button.type = "button";
        buttonContainer.appendChild(button);
      }
    );
  }

  container.appendChild(buttonContainer);
}

function cleanupButtonBar() {
  if (observer) {
    observer.disconnect();
    observer = null;
    observedNode = null;
  }
  if (activeForm && formSubmitHandler) {
    activeForm.removeEventListener("submit", formSubmitHandler);
    activeForm = null;
    formSubmitHandler = null;
  }

  if (activeEditorWrapper && activeEditor) {
    activeEditor.classList.remove("cc-editor-enhanced");
    activeEditorWrapper.parentElement?.insertBefore(
      activeEditor,
      activeEditorWrapper
    );
    activeEditorWrapper.remove();
    activeEditorWrapper = null;
  }

  if (buttonBar) {
    buttonBar.remove();
    buttonBar = null;
  }
}

// -- Event Handlers --
function handleFocusIn(e: FocusEvent) {
  const target = e.target as HTMLElement;
  if (!target) return;

  const isTextarea = target.tagName.toLowerCase() === "textarea";
  const isContentEditable = target.isContentEditable;

  if (!isTextarea && !isContentEditable) {
    return;
  }

  // If we focus on a new editor, clean up the old bar
  if (activeEditor && activeEditor !== target) {
    cleanup();
  }

  // Don't show a bar if one is already active or another flow is in progress
  if (buttonBar || currentStage !== Stage.INACTIVE) {    
    return;
  }

  activeEditor = target;
  currentStage = Stage.BUTTON_UI;

  const wrapper = document.createElement("div");
  wrapper.className = "cc-wrapper";
  activeEditor.parentElement?.insertBefore(wrapper, activeEditor);
  activeEditorWrapper = wrapper;

  activeEditor.classList.add("cc-editor-enhanced");

  buttonBar = createButtonBar(wrapper);
  wrapper.appendChild(activeEditor);

  renderLabelButtons(buttonBar);
  buttonBar.addEventListener("click", onButtonBarClick);
  setupCleanupListeners();

  checkSelectedOptions(target);

  activeEditor.focus();
}

function handleInput(e: Event) {
  // If the snippet is changed by other source, we need to update the UI
  const target = e.target as HTMLTextAreaElement | HTMLElement;
  if (!target) return;

  checkSelectedOptions(target);
}

function checkSelectedOptions(target: HTMLTextAreaElement | HTMLElement) {
  const { text } = getEditorState(target);
  snippet = text;

  // Parse existing snippet to update selectedLabel and selectedDecoration
  const prefixRegex = /^\*\*([^(]+?)(?:\s*\(([^)]+)\))?\s*:\s*/;
  const match = snippet.match(prefixRegex);

  if (match) {
    const label = match[1].trim();
    const decoration = match[2] ? match[2].trim() : "";

    // Validate label exists in COMMENT_TYPES
    const commentType = COMMENT_TYPES.find((c) => c.label === label);
    const decorationType = commentType?.decorations?.find(
      (d) => !decoration.length ? d === Decorator.NONE : d === `(${decoration})` // Regex will match non-blocking instead of (non-blocking)
    );
    if (commentType) {
      selectedLabel = label;

      // Update UI to reflect current state
      if (buttonBar) {
        if (decorationType) {
          selectedDecoration = decorationType;
          renderDecorationButtons(buttonBar, selectedLabel, decorationType);
        } else {
          renderLabelButtons(buttonBar, selectedLabel);
        }
      }
    }
  } else {
    // No valid snippet found, reset state
    selectedLabel = "";
    selectedDecoration = "";

    // Update UI to show default state
    if (buttonBar) {
      renderLabelButtons(buttonBar);
    }
  }
}

// -- Setup --
export function setup() {
  initState();

  document.addEventListener("focusin", handleFocusIn);
  document.addEventListener("input", handleInput);
}
