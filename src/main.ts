import { COMMENT_TYPES, DECORATIONS } from "./constants";
import { CommentType, Decoration, EditorState, Stage } from "./types";

let activeEditor: HTMLTextAreaElement | HTMLElement | null = null;
let suggestionsPopup: HTMLDivElement | null = null;
let buttonBar: HTMLDivElement | null = null;
let activeSuggestionIndex: number = 0;
let triggerIndex: number = -1;
let currentStage: Stage = Stage.INACTIVE;
let selectedLabel: string = "";
let selectedDecoration: string = "";
let activeEditorWrapper: HTMLDivElement | null = null;

let observedNode: HTMLElement | null = null;
let observer: MutationObserver | null = null;
let activeForm: HTMLFormElement | null = null;
let formSubmitHandler: (() => void) | null = null;

// Initialize the extension based on the user's saved setting.
chrome.storage.sync.get({ triggerMode: "buttons" }, (data) => {
  if (data.triggerMode === "buttons") {
    document.addEventListener("focusin", handleFocusIn);
  } else {
    document.addEventListener("input", handleInput);
  }
});

document.addEventListener(
  "keydown",
  (e: KeyboardEvent): void => {
    if (currentStage === Stage.INACTIVE) return;

    if (e.key === "ArrowDown" || (e.key === "j" && e.ctrlKey)) {
      e.preventDefault();
      updateActiveSuggestion(1);
    } else if (e.key === "ArrowUp" || (e.key === "k" && e.ctrlKey)) {
      e.preventDefault();
      updateActiveSuggestion(-1);
    } else if (e.key === "Enter" && !e.shiftKey) {
      if (
        currentStage === Stage.SELECTING_LABEL ||
        currentStage === Stage.SELECTING_DECORATION
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleEnter();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleEscape();
    }
  },
  true
);

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
  buttonBar.addEventListener("click", handleButtonBarClick);
  setupCleanupListeners();
}

function handleInput(e: Event) {
  if (currentStage === Stage.SELECTING_DECORATION) return;

  const target = e.target as HTMLElement;
  if (!target) {
    cleanup();
    return;
  }

  activeEditor = target;
  const { text, cursorPosition } = getEditorState(activeEditor);

  triggerIndex = text.substring(0, cursorPosition).lastIndexOf("!");

  const commentTypesInjected = COMMENT_TYPES.some(({ label }) => text.startsWith(`**${label}`));

  if (triggerIndex < 0 || commentTypesInjected) {
    // If user is typing something else and a popup is open, close it.
    if (suggestionsPopup) {
      cleanup();
    }
    return;
  }

  // User typed '!', so we want the popup.
  // If the button bar is showing, we need to transition from buttons to popup.
  if (buttonBar) {
    cleanupButtonBar(); // Clean up buttons, but keep editor state.
    if (activeEditor) {
      activeEditor.focus(); // Refocus editor after DOM manipulation.
    }
  }

  const regex = /\s/g;
  regex.lastIndex = triggerIndex;
  const nextLineIdx = regex.exec(text)?.index ?? text.length;
  const query = text.substring(triggerIndex + 1, Math.max(triggerIndex + 1, nextLineIdx, cursorPosition));
  const filteredLabels = COMMENT_TYPES.filter((c: CommentType) =>
    c.label.startsWith(query.toLowerCase())
  );

  if (filteredLabels.length > 0) {
    currentStage = Stage.SELECTING_LABEL;
    showSuggestions(filteredLabels);
  } else {
    // If '!' is typed but there are no matches, just clean up everything.
    cleanup();
  }
}

function handleEnter(): void {
  if (!suggestionsPopup) return;
  const selectedItem = suggestionsPopup.querySelector(
    "li.active"
  ) as HTMLLIElement;
  if (!selectedItem) return;

  if (currentStage === Stage.SELECTING_LABEL) {
    selectedLabel = selectedItem.dataset.label || "";
    currentStage = Stage.SELECTING_DECORATION;
    activeEditor?.blur();
    showSuggestions(DECORATIONS);
  } else if (currentStage === Stage.SELECTING_DECORATION) {
    const selectedDecoration = selectedItem.dataset.label || "";
    let snippet: string;
    if (selectedDecoration === "none") {
      snippet = `**${selectedLabel}:** `;
    } else {
      snippet = `**${selectedLabel} (${selectedDecoration}):** `;
    }
    insertSnippet(snippet);
  }
}

function handleEscape(): void {
  if (currentStage === Stage.SELECTING_DECORATION) {
    const snippet = `**${selectedLabel}:** `;
    insertSnippet(snippet);
  } else {
    cleanup();
  }
}

function insertSnippet(snippet: string): void {
  if (!activeEditor) {
    cleanup();
    return;
  }

  const { text, cursorPosition } = getEditorState(activeEditor);
  const textBefore = text.substring(0, triggerIndex);
  const textAfter = text.substring(cursorPosition);

  if (activeEditor.isContentEditable) {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    range.setStart(range.startContainer, triggerIndex);
    range.setEnd(range.startContainer, cursorPosition);
    range.deleteContents();
    const textNode = document.createTextNode(snippet);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    const textareaElement = activeEditor as HTMLTextAreaElement;
    textareaElement.value = snippet + textBefore + textAfter;

    const newCursorPos = snippet.length;
    textareaElement.selectionStart = newCursorPos;
    textareaElement.selectionEnd = newCursorPos;
    textareaElement.scrollTop = 0;
  }

  activeEditor.focus();
  activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
  cleanup();
}

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

function handleButtonBarClick(e: MouseEvent) {
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
      const snippet = `**${label}:** `;
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
    const snippet = `**${selectedLabel} ${decoration}:** `;
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
  console.log("text", text);
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

document.addEventListener("click", (e: Event): void => {
  const target = e.target as HTMLElement;
  if (suggestionsPopup && !suggestionsPopup.contains(target)) {
    cleanup();
  }
});

function getEditorState(
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

function showSuggestions(items: CommentType[] | Decoration[]): void {
  if (!suggestionsPopup) {
    suggestionsPopup = document.createElement("div");
    suggestionsPopup.id = "conventional-comment-popup";
    document.body.appendChild(suggestionsPopup);
  }

  positionPopup();

  activeSuggestionIndex = 0;
  suggestionsPopup.innerHTML = `
    ${selectedLabel ? `<div class="popup-header"><span class="type-badge">${selectedLabel}</span></div>` : ''}
    <ul>
      ${items
        .map(
          (item, index) => `
        <li class="${index === 0 ? "active" : ""}" data-label="${item.label}">
          <strong>${item.label}</strong>: ${item.description}
        </li>
      `
        )
        .join("")}
    </ul>
  `;

  suggestionsPopup.querySelectorAll("li").forEach((item, index) => {
    item.addEventListener("mousedown", () => {
      updateActiveSuggestion(index - activeSuggestionIndex);
      handleEnter();
    });
  });
}

function updateActiveSuggestion(direction: number): void {
  if (!suggestionsPopup) return;

  const items = suggestionsPopup.querySelectorAll("li");
  if (!items.length) return;

  items[activeSuggestionIndex].classList.remove("active");
  activeSuggestionIndex =
    (activeSuggestionIndex + direction + items.length) % items.length;
  items[activeSuggestionIndex].classList.add("active");
}

function positionPopup(): void {
  if (!activeEditor || !suggestionsPopup) return;

  const rect = activeEditor.getBoundingClientRect();
  suggestionsPopup.style.top = `${window.scrollY + rect.bottom + 5}px`;
  suggestionsPopup.style.left = `${window.scrollX + rect.left}px`;
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

function cleanup(): void {
  cleanupButtonBar();

  if (suggestionsPopup) {
    suggestionsPopup.remove();
    suggestionsPopup = null;
  }
  activeSuggestionIndex = 0;
  triggerIndex = -1;
  activeEditor = null;
  currentStage = Stage.INACTIVE;
  selectedLabel = "";
  selectedDecoration = "";
}

function createButtonBar(container: HTMLElement): HTMLDivElement {
  const bar = document.createElement("div");
  bar.id = "conventional-comment-button-bar";
  container.appendChild(bar);
  return bar;
}

function renderLabelButtons(container: HTMLDivElement, activeLabel?: string): void {
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
