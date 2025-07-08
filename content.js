const commentTypes = [
  { label: 'praise', description: 'Highlights something positive.' },
  { label: 'nitpick', description: 'A minor, non-critical issue.' },
  { label: 'suggestion', description: 'Suggests a specific improvement.' },
  { label: 'question', description: 'Asks for clarification.' },
  { label: 'thought', description: 'A thought process or exploration of ideas.' },
  { label: 'chore', description: 'A small, necessary task or cleanup.' },
  { label: 'issue', description: 'Links to a new or existing issue.' },
];

const conventionalComments = [];
commentTypes.forEach(type => {
  conventionalComments.push({
    label: `${type.label} (non-blocking)`,
    description: type.description,
    snippet: `**${type.label} (non-blocking):** `
  });
  conventionalComments.push({
    label: `${type.label} (blocking)`,
    description: type.description,
    snippet: `**${type.label} (blocking):** `
  });
});

let activeEditor = null;
let suggestionsPopup = null;
let activeSuggestionIndex = 0;
let triggerIndex = -1;

document.addEventListener('keydown', (e) => {
  if (!suggestionsPopup) return;

  if ((e.key === 'ArrowDown') || (e.key === 'j' && e.ctrlKey)) {
    e.preventDefault();
    updateActiveSuggestion(1);
  } else if ((e.key === 'ArrowUp') || (e.key === 'k' && e.ctrlKey)) {
    e.preventDefault();
    updateActiveSuggestion(-1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    selectSuggestion();
  } else if (e.key === 'Escape') {
    cleanup();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape' || e.ctrlKey) {
    return;
  }

  const target = e.target;
  const isTextarea = target.tagName.toLowerCase() === 'textarea';
  const isContentEditable = target.isContentEditable;

  if (!isTextarea && !isContentEditable) {
    cleanup();
    return;
  }

  activeEditor = target;

  const { text, cursorPosition } = getEditorState(activeEditor);
  if (cursorPosition === null) {
    cleanup();
    return;
  }

  const textBeforeCursor = text.substring(0, cursorPosition);

  triggerIndex = textBeforeCursor.lastIndexOf('!');

  if (triggerIndex === -1) {
    cleanup();
    return;
  }

  const query = textBeforeCursor.substring(triggerIndex + 1);

  if (/\s/.test(query)) {
    cleanup();
    return;
  }

  const filteredComments = conventionalComments.filter(c => c.label.startsWith(query.toLowerCase()));

  if (filteredComments.length > 0) {
    showSuggestions(filteredComments);
  } else {
    cleanup();
  }
});

document.addEventListener('click', (e) => {
  if (suggestionsPopup && !suggestionsPopup.contains(e.target)) {
    cleanup();
  }
});

function getEditorState(editor) {
    if (editor.isContentEditable) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return { text: editor.textContent, cursorPosition: null };
        const range = selection.getRangeAt(0);
        return { text: editor.textContent, cursorPosition: range.startOffset };
    } else {
        return { text: editor.value, cursorPosition: editor.selectionStart };
    }
}

function selectSuggestion() {
  const selectedItem = suggestionsPopup.querySelector('li.active');
  if (!selectedItem || !activeEditor) {
    cleanup();
    return;
  }

  const snippet = selectedItem.dataset.snippet;

  if (activeEditor.isContentEditable) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    range.setStart(range.startContainer, triggerIndex);
    range.setEnd(range.startContainer, getEditorState(activeEditor).cursorPosition);

    range.deleteContents();
    const textNode = document.createTextNode(snippet);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    const { value, selectionStart } = activeEditor;
    const textBefore = value.substring(0, triggerIndex);
    const textAfter = value.substring(selectionStart);

    activeEditor.value = textBefore + snippet + textAfter;

    const newCursorPos = triggerIndex + snippet.length;
    activeEditor.selectionStart = newCursorPos;
    activeEditor.selectionEnd = newCursorPos;
  }

  activeEditor.focus();
  activeEditor.dispatchEvent(new Event('input', { bubbles: true, compose: true }));
  cleanup();
}

function showSuggestions(comments) {
  if (!suggestionsPopup) {
    suggestionsPopup = document.createElement('div');
    suggestionsPopup.id = 'conventional-comment-popup';
    document.body.appendChild(suggestionsPopup);
  }

  activeSuggestionIndex = 0;
  suggestionsPopup.innerHTML = `
    <ul>
      ${comments.map((comment, index) => `
        <li class="${index === activeSuggestionIndex ? 'active' : ''}" data-snippet="${comment.snippet}">
          <strong>${comment.label}</strong>: ${comment.description}
        </li>
      `).join('')}
    </ul>
  `;

  suggestionsPopup.querySelectorAll('li').forEach((item, index) => {
    item.addEventListener('click', () => {
      activeSuggestionIndex = index;
      selectSuggestion();
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
}
