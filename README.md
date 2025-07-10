# GitHub Conventional Comments

A Chrome extension that suggests conventional comments on GitHub.

## Features

- Type '!' in any GitHub comment field to trigger conventional comment suggestions
- Navigate suggestions using arrow keys or Ctrl+j/k
- Press Enter to select a suggestion
- Press Escape to cancel or insert without decoration
- Supports both light and dark modes

## Development

This project uses npm, gulp, and TypeScript for building and development.

### Prerequisites

- Node.js (v14 or higher)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Build Commands

- **Build for production**: `npm run build` (minified)
- **Development mode**: `npm run dev` (unminified, auto-rebuild, watch for changes)
- **Clean build files**: `npm run clean`

### Installing the Extension

1. Run `npm run dev` or `npm run build` to build the extension
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/` folder

## Usage

1. Go to any GitHub page
2. Click in a comment field or start a new comment
3. Type '!' to trigger the suggestion popup
4. Use arrow keys or Ctrl+j/k to navigate
5. Press Enter to select a comment type
6. Select a decoration (blocking/non-blocking) or press Escape for no decoration

## Comment Types

- **praise**: Highlights something positive
- **nitpick**: A minor, non-critical issue
- **suggestion**: Suggests a specific improvement
- **issue**: Highlights a problem with the subject under review
- **todo**: A small, trivial, but necessary change
- **question**: Asks for clarification
- **thought**: Represents an idea that popped up from reviewing
- **chore**: A simple task that must be done before the subject can be "officially" accepted
- **note**: Highlights something the reader should take note of
