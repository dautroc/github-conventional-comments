const conventionalComments = [
  { label: 'praise', description: 'Highlights something positive.', snippet: 'praise: ' },
  { label: 'nitpick', description: 'A minor, non-critical issue.', snippet: 'nitpick: ' },
  { label: 'suggestion', description: 'Suggests a specific improvement.', snippet: 'suggestion: ' },
  { label: 'question', description: 'Asks for clarification.', snippet: 'question: ' },
  { label: 'thought', description: 'A thought process or exploration of ideas.', snippet: 'thought: ' },
  { label: 'chore', description: 'A small, necessary task or cleanup.', snippet: 'chore: ' },
  { label: 'issue', description: 'Links to a new or existing issue.', snippet: 'issue: ' },
];

let activeTextarea = null;
let suggestionsPopup = null;
let activeSuggestionIndex = 0;
let triggerIndex = -1;

document.addEventListener('keyup', (e) => {
  if (e.target.tagName.toLowerCase() !== 'textarea') {
    cleanup();
    return;
  }

  activeTextarea = e.target;
  const { value, selectionStart } = activeTextarea;

  if (suggestionsPopup) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateActiveSuggestion(1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      updateActiveSuggestion(-1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      selectSuggestion();
      return;
    }
    if (e.key === 'Escape') {
      cleanup();
      return;
    }
  }

  const textBeforeCursor = value.substring(0, selectionStart);
  triggerIndex = textBeforeCursor.lastIndexOf('/');

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

function showSuggestions(comments) {
  if (!suggestionsPopup) {
    suggestionsPopup = document.createElement('div');
    suggestionsPopup.id = 'conventional-comment-popup';
    document.body.appendChild(suggestionsPopup);
  }

  suggestionsPopup.innerHTML = `
    <ul>
      ${comments.map((comment, index) => `
        <li class="${index === 0 ? 'active' : ''}" data-snippet="${comment.snippet}">
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
  updateActiveSuggestion(0);
}

function updateActiveSuggestion(direction) {
  const items = suggestionsPopup.querySelectorAll('li');
  if (!items.length) return;

  activeSuggestionIndex = (activeSuggestionIndex + direction + items.length) % items.length;

  items.forEach((item, index) => {
    item.classList.toggle('active', index === activeSuggestionIndex);
  });
}

function selectSuggestion() {
  const selectedItem = suggestionsPopup.querySelector('li.active');
  if (!selectedItem || !activeTextarea) {
    cleanup();
    return;
  }

  const snippet = selectedItem.dataset.snippet;
  const { value, selectionStart } = activeTextarea;

  const newText = value.substring(0, triggerIndex) + snippet + value.substring(selectionStart);

  activeTextarea.value = newText;
  activeTextarea.focus();

  const newCursorPos = triggerIndex + snippet.length;
  activeTextarea.selectionStart = newCursorPos;
  activeTextarea.selectionEnd = newCursorPos;

  activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));

  cleanup();
}

function positionPopup() {
    if (!activeTextarea || !suggestionsPopup) return;
    const rect = activeTextarea.getBoundingClientRect();
    // Position the popup slightly below the textarea
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
}
