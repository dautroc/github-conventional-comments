# GitHub Conventional Comments

A browser extension that helps you write clear, actionable feedback on GitHub by suggesting conventional comment templates. Supports both Chrome and Chromium-based browsers.

---

## Demo

TBU

---

## Features

- **Suggests Conventional Comments:**  
  - Type `!` in any GitHub comment field to trigger a popup menu of comment types.
  - Or, add a button bar above comment boxes to quickly select comment types.
  - Choose your preferred trigger mode (popup, button bar, or both) in the extension settings.
- **Keyboard Navigation:**  
  - Move through suggestions using arrow keys or <kbd>Ctrl</kbd>+<kbd>j</kbd>/<kbd>k</kbd>.
  - <kbd>Enter</kbd> to select, <kbd>Escape</kbd> to discard.
- **Decorations:**  
  - Some types support decorations (e.g., “blocking”, “non-blocking”, “if-minor”) to clarify urgency.
- **Light & Dark Theme:**  
  - Matches your GitHub color scheme.
- **Persistent Settings:**  
  - Remembers your preferred trigger mode via browser storage.

---

## Comment Types

| Type        | Description                              | Decorations                |
|-------------|------------------------------------------|----------------------------|
| **Issue**     | A problem or bug.                        | `none`, `blocking`, `non-blocking`, `if-minor` |
| **Question**  | A question about the code.               | `none`, `blocking`, `non-blocking`     |
| **Suggestion**| A suggestion for improvement.            | `none`, `blocking`, `non-blocking`, `if-minor` |
| **Praise**    | Praise for well-written code.            | –                          |
| **Nitpick**   | Minor, non-critical style issue.         | –                          |
| **Thought**   | Exploration of an idea.                  | –                          |
| **Chore**     | Routine task or maintenance.             | `none`, `if-minor`                   |

---

## Installation

1. **Build the Extension:**
   ```bash
   npm install
   npm run build
   ```
2. **Load into Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/` folder in this project.

---

## Usage

On any GitHub comment or review field:
  - **Popup Menu:** Type `!` to open the suggestions popup.
    - Navigate options with arrow keys / <kbd>Ctrl</kbd>+<kbd>j</kbd>/<kbd>k</kbd>.
    - Press <kbd>Enter</kbd> to insert a comment label (and choose a decoration if prompted).
    - Press <kbd>Escape</kbd> to discard all.
  - **Button Bar:** If enabled, click any label/decoration above the comment box.

### Settings

- Click the extension icon in your browser and open the settings dialog.
- Choose your preferred trigger mode:
  - **Button UI:** Always show label buttons.
  - **"!" Trigger:** Use the popup by typing `!`.
  - **Both:** Enable both triggers.

---

## Development

This project uses TypeScript, gulp, and esbuild.

### Build Commands

- **Production build:**  
  `npm run build`
- **Development mode (watch):**  
  `npm run dev`
- **Clean build files:**  
  `npm run clean`

Build output is in the `extension/` directory.

---

## Release

Automated release workflow is configured via GitHub Actions.  
On new version tags (`v*.*.*`), the extension is built and zipped for release.
