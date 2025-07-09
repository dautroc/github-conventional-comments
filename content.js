const commentTypes = [
  { label: 'praise', description: 'Highlights something positive.' },
  { label: 'nitpick', description: 'A minor, non-critical issue.' },
  { label: 'suggestion', description: 'Suggests a specific improvement.' },
  { label: 'issue', description: 'Highlights a problem with the subject under review.' },
  { label: 'todo', description: 'A small, trivial, but necessary change.' },
  { label: 'question', description: 'Asks for clarification.' },
  { label: 'thought', description: 'Represents an idea that popped up from reviewing.' },
  { label: 'chore', description: 'A simple task that must be done before the subject can be "officially" accepted.' },
  { label: 'note', description: 'Highlights something the reader should take note of.' },
];

const decorations = [
  { label: '(non-blocking)', description: 'Should not prevent the subject from being accepted.' },
  { label: '(blocking)', description: 'Should prevent the subject from being accepted until resolved.' },
  { label: '(if-minor)', description: 'Resolve only if the changes end up being minor or trivial.' },
];

const STAGE = {
  INACTIVE: 0,
  SELECTING_LABEL: 1,
  SELECTING_DECORATION: 2,
};

let activeEditor = null;
let suggestionsPopup = null;
let activeSuggestionIndex = 0;
let triggerIndex = -1;
let currentStage = STAGE.INACTIVE;
let selectedLabel = '';

document.addEventListener('keydown', (e) => {
  if (currentStage === STAGE.INACTIVE) return;

  if ((e.key === 'ArrowDown') || (e.key === 'j' && e.ctrlKey)) {
    e.preventDefault();
    updateActiveSuggestion(1);
  } else if ((e.key === 'ArrowUp') || (e.key === 'k' && e.ctrlKey)) {
    e.preventDefault();
    updateActiveSuggestion(-1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    handleEnter();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    handleEscape();
  }
});

document.addEventListener('keyup', (e) => {
  if (currentStage !== STAGE.INACTIVE) return;
  if (e.key !== '!') return;

  const target = document.activeElement;
  if (!target) return;

  const isTextarea = target.tagName.toLowerCase() === 'textarea';
  const isContentEditable = target.isContentEditable;
  if (!isTextarea && !isContentEditable) return;

  activeEditor = target;
  const { text } = getEditorState(activeEditor);

  if (text.trim() === '!') {
    triggerIndex = text.indexOf('!');
    currentStage = STAGE.SELECTING_LABEL;
    showSuggestions(commentTypes);
  }
});

function handleEnter() {
  const items = suggestionsPopup.querySelectorAll('li');
  const selectedItem = items[activeSuggestionIndex];
  if (!selectedItem) return;

  if (currentStage === STAGE.SELECTING_LABEL) {
    selectedLabel = selectedItem.dataset.label;
    currentStage = STAGE.SELECTING_DECORATION;
    showSuggestions(decorations);
  } else if (currentStage === STAGE.SELECTING_DECORATION) {
    const selectedDecoration = selectedItem.dataset.label;
    const snippet = `**${selectedLabel} ${selectedDecoration}:** `;
    insertSnippet(snippet);
  }
}

function handleEscape() {
  if (currentStage === STAGE.SELECTING_DECORATION) {
    const snippet = `**${selectedLabel}:** `;
    insertSnippet(snippet);
  } else {
    cleanup();
  }
}

function insertSnippet(snippet) {
  const { cursorPosition } = getEditorState(activeEditor);

  if (activeEditor.isContentEditable) {
    const selection = window.getSelection();
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
    const { value } = activeEditor;
    const textBefore = value.substring(0, triggerIndex);
    const textAfter = value.substring(cursorPosition);
    activeEditor.value = textBefore + snippet + textAfter;
    const newCursorPos = triggerIndex + snippet.length;
    activeEditor.selectionStart = newCursorPos;
    activeEditor.selectionEnd = newCursorPos;
  }

  activeEditor.focus();
  activeEditor.dispatchEvent(new Event('input', { bubbles: true, compose: true }));
  cleanup();
}

document.addEventListener('click', (e) => {
  if (suggestionsPopup && !suggestionsPopup.contains(e.target)) {
    cleanup();
  }
});

function getEditorState(editor) {
  if (!editor) return { text: '', cursorPosition: 0 };
  if (editor.isContentEditable) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return { text: editor.textContent, cursorPosition: editor.textContent.length };
    const range = selection.getRangeAt(0);
    return { text: editor.textContent, cursorPosition: range.startOffset };
  } else {
    return { text: editor.value, cursorPosition: editor.selectionStart };
  }
}

function showSuggestions(items) {
  if (!suggestionsPopup) {
    suggestionsPopup = document.createElement('div');
    suggestionsPopup.id = 'conventional-comment-popup';
    document.body.appendChild(suggestionsPopup);
  }

  activeSuggestionIndex = 0;
  suggestionsPopup.innerHTML = `
    <ul>
      ${items.map((item, index) => `
        <li class="${index === 0 ? 'active' : ''}" data-label="${item.label}">
          <strong>${item.label}</strong>: ${item.description}
        </li>
      `).join('')}
    </ul>
  `;

  suggestionsPopup.querySelectorAll('li').forEach((item, index) => {
    item.addEventListener('click', () => {
      activeSuggestionIndex = index;
      handleEnter();
    });
  });

  positionPopup();
}

function updateActiveSuggestion(direction) {
  const items = suggestionsPopup.querySelectorAll('li');
  if (!items.length) return;

  items[activeSuggestionIndex].classList.remove('active');
  activeSuggestionIndex = (activeSuggestionIndex + direction + items.length) % items.length;
  items[activeSuggestionIndex].classList.add('active');
}

function positionPopup() {
  if (!activeEditor || !suggestionsPopup) return;
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
  currentStage = STAGE.INACTIVE;
  selectedLabel = '';
}
