
function createMirror(textarea: HTMLTextAreaElement): HTMLDivElement {
  const mirror = document.createElement('div');
  const style = getComputedStyle(textarea);
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflowWrap = 'break-word';
  mirror.style.top = '0';
  mirror.style.left = '0';
  mirror.style.zIndex = '-1';

  // Copy important styles
  const properties = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'letterSpacing',
    'lineHeight',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'boxSizing',
    'width'
  ];

  for (const prop of properties) {
    mirror.style[prop as any] = style[prop as any];
  }

  document.body.appendChild(mirror);
  return mirror;
}

function getCaretPosition(textarea: HTMLTextAreaElement, triggerIndex: number): { top: number, left: number } {
  const mirror = createMirror(textarea);
  const text = textarea.value.substring(0, triggerIndex);

  // Create span to mark caret
  const span = document.createElement('span');
  span.textContent = '\u200b'; // zero-width space
  mirror.textContent = text;
  mirror.appendChild(span);

  const rect = span.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  document.body.removeChild(mirror);

  return {
    top: rect.top - mirrorRect.top,
    left: rect.left - mirrorRect.left,
  };
}

function getLineHeight(element: HTMLElement): number {
  const temp = document.createElement('span');
  temp.textContent = 'M';
  temp.style.visibility = 'hidden';
  temp.style.position = 'absolute';
  temp.style.font = window.getComputedStyle(element).font;
  document.body.appendChild(temp);
  const height = temp.offsetHeight;
  document.body.removeChild(temp);
  return height;
}

function positionPopup(
  activeEditor: HTMLElement | HTMLTextAreaElement | null,
  suggestionsPopup: HTMLDivElement | null
): void {
  if (!activeEditor || !suggestionsPopup) return;

  const caret = getCaretPosition(activeEditor, triggerIndex);
  const textareaRect = activeEditor.getBoundingClientRect();
  const lineHeight = getLineHeight(activeEditor); // use helper as discussed

  suggestionsPopup.style.top = `${window.scrollY + textareaRect.top + caret.top + lineHeight}px`;

  suggestionsPopup.style.left = `${window.scrollX + textareaRect.left + caret.left}px`;
}

export { positionPopup };
