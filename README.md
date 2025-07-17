# 🎯 GitHub Conventional Comments

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Transform vague feedback into actionable, structured code reviews! 💪

A Chrome extension that brings conventional comments to GitHub, making code reviews clearer, faster, and more effective.

[Demo](https://github.com/user-attachments/assets/634b3e03-8478-47c4-9336-fdc75247ba9a)

## 🎯 Why Use Conventional Comments?

### From This:

- "You should fix this..."
- "Maybe we should change this part?"
- "I don't like how this works"

### To This:

- "**Issue (Blocking)**: This could cause a memory leak in large datasets"
- "**Suggestion (Non-blocking)**: Consider using a more descriptive variable name"
- "**Question**: How does this handle concurrent requests?"

### Benefits:
- 🎯 Clear intention and priority of each comment
- 🚀 Faster review resolution with less back-and-forth
- 🤝 Improved team communication and understanding
- ✨ Consistent review standards across your project

## ✨ Features

[Rest of the content remains the same as the previous version...]

### 🎨 Rich Comment Types
Choose from a variety of purposeful comment types:
- 🐛 **Issue** - Highlight problems or bugs
- ❓ **Question** - Ask for clarification
- 💡 **Suggestion** - Propose improvements
- 🎯 **Nitpick** - Point out minor style issues
- 💭 **Thought** - Share ideas and insights
- ✅ **Todo** - Mark tasks for follow-up
- 📝 **Note** - Add helpful reminders
- 🌟 **Praise** - Recognize good code
- 🔧 **Chore** - Track maintenance tasks

### 🎚️ Flexible Usage Modes
- **Button Mode**: Quick-access buttons in the comment box
- **Trigger Mode**: Type `!` to summon suggestions
- **Hybrid Mode**: Use both for maximum flexibility

[Choose your preference mode in settings](https://github.com/user-attachments/assets/d8fe7c6e-9226-4bb7-819b-f3927d43d0f4)

### 🎭 Comment Decorators
Add context to your comments with decorators:
- 🚫 **Blocking** - Must be resolved before merging
- ⚠️ **Non-blocking** - Should be addressed but not blocking
- 📌 **If Minor** - Address if changes are trivial

### 🎪 Additional Features
- 🌓 Supports both light and dark GitHub themes
- ⌨️ Keyboard-friendly navigation
- ⚡ Quick and responsive interface
- 🔄 Seamless GitHub integration

## 🚀 Quick Start

1. Install from the [Chrome Web Store](your-extension-link)
2. Navigate to any GitHub pull request or issue
3. Choose your preferred interaction mode in extension settings:
   - Buttons only
   - Trigger only (`!` character)
   - Both modes
4. Start leaving structured, meaningful comments!

## ⚙️ Configuration

1. Click the extension icon in your Chrome toolbar
2. Select your preferred interaction mode:
   - 🔘 Buttons only (default)
   - ⌨️ Trigger only
   - 🎛️ Both modes

## 💻 Development

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

## 🤝 Contributing

We love your input! We want to make contributing to GitHub Conventional Comments as easy and transparent as possible.

### Ways to Contribute
- 🐛 Report bugs by opening an issue
- 💡 Suggest new features or improvements
- 🔧 Submit pull requests

### 🐛 Opening an Issue
1. Check existing issues to avoid duplicates
2. Use one of our issue templates if available
3. Be clear and provide as much detail as possible
4. For bugs, include:
    - Steps to reproduce
    - Expected behavior
    - Actual behavior
    - Screenshots if applicable
    - Browser version, OS version, Github UI (new or old)

### 💡 Questions or Suggestions?
Feel free to:
- 🎫 Open an issue in our [GitHub Issues](https://github.com/dautroc/github-conventional-comments/issues)
- ⭐ Star the repo if you find it useful
- 📢 Share with others who might benefit from it

### 🔧 Submitting Changes
1. Fork the repo
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Create a pull request with a clear description of the changes

