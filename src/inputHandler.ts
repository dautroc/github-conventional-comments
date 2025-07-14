import { generateSnippet, getEditorState } from "./common";
import { COMMENT_TYPES, DECORATIONS } from "./constants";
import { CommentType, Decoration, Stage, Decorator } from "./types";

let currentStage: Stage;
let activeEditor: HTMLTextAreaElement | HTMLElement | null;
let suggestionsPopup: HTMLDivElement | null;
let triggerIndex: number;
let activeSuggestionIndex: number;
let selectedLabel: string;
let filteredLabels: CommentType[];

// -- State --
function initState() {
  currentStage = Stage.INACTIVE;
  activeEditor = null;
  suggestionsPopup = null;
  triggerIndex = -1;
  activeSuggestionIndex = 0;
  selectedLabel = "";
  filteredLabels = [];
}

// -- Functions --
function onPressEnter(): void {
  if (!suggestionsPopup) return;
  const selectedItem = suggestionsPopup.querySelector(
    "li.active"
  ) as HTMLLIElement;
  if (!selectedItem) return;

  if (currentStage === Stage.SELECTING_LABEL) {
    selectedLabel = selectedItem.dataset.label || "";
    currentStage = Stage.SELECTING_DECORATION;
    activeEditor?.blur();

    const decorations =
      COMMENT_TYPES.find((d) => d.label === selectedLabel)?.decorations || [];
    const decorationsWithDescription = decorations.map(
      (item) => DECORATIONS.find((d) => d.label === item)!
    );

    if (decorationsWithDescription.length > 0) {
      showSuggestions(decorationsWithDescription);
    } else {
      selectedItem.dataset.label = Decorator.NONE;
      onPressEnter();
    }
  } else if (currentStage === Stage.SELECTING_DECORATION) {
    const selectedDecoration = selectedItem.dataset.label || "";
    let snippet = generateSnippet(selectedLabel, selectedDecoration as Decorator);
    insertSnippet(snippet);
  }
}

function onPressEscape(): void {
  activeEditor?.focus();
  cleanup();
}

function onBackspaceOrDelete(e?: KeyboardEvent): void {
  if (currentStage !== Stage.SELECTING_DECORATION) return;

  e?.preventDefault();
  resetFirstStage();
}

function resetFirstStage(): void {
  selectedLabel = "";
  activeEditor?.focus();
  showSuggestions(filteredLabels);
  currentStage = Stage.SELECTING_LABEL;
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
    textareaElement.focus();
    textareaElement.setSelectionRange(newCursorPos, newCursorPos, "forward");
    textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
  }

  cleanup();
}

function cleanup(): void {
  if (suggestionsPopup) {
    suggestionsPopup.remove();
  }

  initState();
}

// -- UI --
function showSuggestions(items: CommentType[] | Decoration[]): void {
  if (!suggestionsPopup) {
    suggestionsPopup = document.createElement("div");
    suggestionsPopup.id = "conventional-comment-popup";
    document.body.appendChild(suggestionsPopup);
  }

  positionPopup();

  activeSuggestionIndex = 0;
  suggestionsPopup.innerHTML = `
    ${
      selectedLabel
        ? `<div class="popup-header"><span class="type-badge">${selectedLabel}</span></div>`
        : ""
    }
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

  suggestionsPopup.getElementsByClassName("type-badge")[0]?.addEventListener("mousedown", (e) => {
    e.preventDefault();
    resetFirstStage();
  });

  suggestionsPopup.querySelectorAll("li").forEach((item, index) => {
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      updateActiveSuggestion(index - activeSuggestionIndex);
      onPressEnter();
    });
  });
}

function positionPopup(): void {
  if (!activeEditor || !suggestionsPopup) return;

  const rect = activeEditor.getBoundingClientRect();
  suggestionsPopup.style.top = `${window.scrollY + rect.bottom + 5}px`;
  suggestionsPopup.style.left = `${window.scrollX + rect.left}px`;
}

// -- Event Handlers --
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (suggestionsPopup && !suggestionsPopup.contains(target)) {
    cleanup();
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (currentStage === Stage.INACTIVE) return;

  if (e.key === "ArrowDown" || (e.key === "j" && e.ctrlKey)) {
    e.preventDefault();
    updateActiveSuggestion(1);
  } else if (e.key === "ArrowUp" || (e.key === "k" && e.ctrlKey)) {
    e.preventDefault();
    updateActiveSuggestion(-1);
  } else if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    if (
      currentStage === Stage.SELECTING_LABEL ||
      currentStage === Stage.SELECTING_DECORATION
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      onPressEnter();
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    onPressEscape();
  } else if (e.key === "Backspace" || e.key === "Delete") {
    onBackspaceOrDelete(e);
  }
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

  const commentTypesInjected = COMMENT_TYPES.some(({ label }) =>
    text.startsWith(`**${label}`)
  );

  if (triggerIndex < 0 || commentTypesInjected) {
    // If user is typing something else and a popup is open, close it.
    if (suggestionsPopup) {
      cleanup();
    }
    return;
  }

  const regex = /\s/g;
  regex.lastIndex = triggerIndex;
  const nextLineIdx = regex.exec(text)?.index ?? text.length;
  const query = text.substring(
    triggerIndex + 1,
    Math.max(triggerIndex + 1, nextLineIdx, cursorPosition)
  );
  filteredLabels = COMMENT_TYPES.filter((c: CommentType) =>
    c.label.toLowerCase().startsWith(query.toLowerCase())
  );

  if (filteredLabels.length > 0) {
    currentStage = Stage.SELECTING_LABEL;
    showSuggestions(filteredLabels);
  } else {
    // If '!' is typed but there are no matches, just clean up everything.
    cleanup();
  }
}

// -- Setup --
export function setup() {
  initState();

  document.addEventListener("input", handleInput);
  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("click", handleClickOutside);
}
