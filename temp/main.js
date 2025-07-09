"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const types_1 = require("./types");
let activeEditor = null;
let suggestionsPopup = null;
let activeSuggestionIndex = 0;
let triggerIndex = -1;
let currentStage = types_1.Stage.INACTIVE;
let selectedLabel = "";
document.addEventListener("keydown", (e) => {
    if (currentStage === types_1.Stage.INACTIVE)
        return;
    if (e.key === "ArrowDown" || (e.key === "j" && e.ctrlKey)) {
        e.preventDefault();
        updateActiveSuggestion(1);
    }
    else if (e.key === "ArrowUp" || (e.key === "k" && e.ctrlKey)) {
        e.preventDefault();
        updateActiveSuggestion(-1);
    }
    else if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleEnter();
    }
    else if (e.key === "Escape") {
        e.preventDefault();
        handleEscape();
    }
}, true);
document.addEventListener("input", (e) => {
    console.log("input");
    if (currentStage === types_1.Stage.SELECTING_DECORATION)
        return;
    const target = e.target;
    if (!target) {
        cleanup();
        return;
    }
    const isTextarea = target.tagName.toLowerCase() === "textarea";
    const isContentEditable = target.isContentEditable;
    if (!isTextarea && !isContentEditable) {
        cleanup();
        return;
    }
    activeEditor = target;
    const { text } = getEditorState(activeEditor);
    triggerIndex = text.indexOf("!");
    if (triggerIndex !== 0) {
        cleanup();
        return;
    }
    const query = text.substring(triggerIndex + 1);
    const filteredLabels = constants_1.COMMENT_TYPES.filter((c) => c.label.startsWith(query.toLowerCase()));
    if (filteredLabels.length > 0) {
        currentStage = types_1.Stage.SELECTING_LABEL;
        showSuggestions(filteredLabels);
    }
    else {
        cleanup();
    }
});
function handleEnter() {
    if (!suggestionsPopup)
        return;
    const selectedItem = suggestionsPopup.querySelector("li.active");
    if (!selectedItem)
        return;
    if (currentStage === types_1.Stage.SELECTING_LABEL) {
        selectedLabel = selectedItem.dataset.label || "";
        currentStage = types_1.Stage.SELECTING_DECORATION;
        showSuggestions(constants_1.DECORATIONS);
    }
    else if (currentStage === types_1.Stage.SELECTING_DECORATION) {
        const selectedDecoration = selectedItem.dataset.label || "";
        let snippet;
        if (selectedDecoration === "none") {
            snippet = `**${selectedLabel}:** `;
        }
        else {
            snippet = `**${selectedLabel} ${selectedDecoration}:** `;
        }
        insertSnippet(snippet);
    }
}
function handleEscape() {
    if (currentStage === types_1.Stage.SELECTING_DECORATION) {
        const snippet = `**${selectedLabel}:** `;
        insertSnippet(snippet);
    }
    else {
        cleanup();
    }
}
function insertSnippet(snippet) {
    if (!activeEditor) {
        cleanup();
        return;
    }
    const { text, cursorPosition } = getEditorState(activeEditor);
    const textBefore = text.substring(0, triggerIndex);
    const textAfter = text.substring(cursorPosition);
    if (activeEditor.isContentEditable) {
        const selection = window.getSelection();
        if (!selection)
            return;
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
    }
    else {
        const textareaElement = activeEditor;
        textareaElement.value = textBefore + snippet + textAfter;
        const newCursorPos = (textBefore + snippet).length;
        textareaElement.selectionStart = newCursorPos;
        textareaElement.selectionEnd = newCursorPos;
    }
    activeEditor.focus();
    activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
    cleanup();
}
document.addEventListener("click", (e) => {
    const target = e.target;
    if (suggestionsPopup && !suggestionsPopup.contains(target)) {
        cleanup();
    }
});
function getEditorState(editor) {
    if (!editor)
        return { text: "", cursorPosition: 0 };
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
    }
    else {
        const textareaElement = editor;
        return {
            text: textareaElement.value,
            cursorPosition: textareaElement.selectionStart,
        };
    }
}
function showSuggestions(items) {
    if (!suggestionsPopup) {
        suggestionsPopup = document.createElement("div");
        suggestionsPopup.id = "conventional-comment-popup";
        document.body.appendChild(suggestionsPopup);
    }
    positionPopup();
    activeSuggestionIndex = 0;
    suggestionsPopup.innerHTML = `
    <ul>
      ${items
        .map((item, index) => `
        <li class="${index === 0 ? "active" : ""}" data-label="${item.label}">
          <strong>${item.label}</strong>: ${item.description}
        </li>
      `)
        .join("")}
    </ul>
  `;
    suggestionsPopup.querySelectorAll("li").forEach((item, index) => {
        item.addEventListener("click", () => {
            activeSuggestionIndex = index;
            handleEnter();
        });
    });
}
function updateActiveSuggestion(direction) {
    if (!suggestionsPopup)
        return;
    const items = suggestionsPopup.querySelectorAll("li");
    if (!items.length)
        return;
    items[activeSuggestionIndex].classList.remove("active");
    activeSuggestionIndex =
        (activeSuggestionIndex + direction + items.length) % items.length;
    items[activeSuggestionIndex].classList.add("active");
}
function positionPopup() {
    if (!activeEditor || !suggestionsPopup)
        return;
    const rect = activeEditor.getBoundingClientRect();
    suggestionsPopup.style.top = `${window.scrollY + rect.bottom + 5}px`;
    suggestionsPopup.style.left = `${window.scrollX + rect.left}px`;
}
function cleanup() {
    if (suggestionsPopup) {
        suggestionsPopup.remove();
        suggestionsPopup = null;
    }
    activeSuggestionIndex = 0;
    triggerIndex = -1;
    activeEditor = null;
    currentStage = types_1.Stage.INACTIVE;
    selectedLabel = "";
}
