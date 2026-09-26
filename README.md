# Oshiete

Chrome Extension for breaking down Japanese sentences with an AI-powered grammar tutor.

## Install and run

Requirements: Chrome.

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this repository's `extension/` directory.
3. Open the extension's **Details → Extension options** (or click **Settings** in the side panel), paste your OpenAI API key, and optionally enable dark mode under **Appearance**.
4. Choose a presentation mode:
   - Press **Ctrl+Shift+Y** (macOS: **Command+Shift+Y**) to open a floating popup beside the highlighted text without resizing the webpage; selected text is analyzed automatically.
   - Press **Ctrl+Shift+U** (macOS: **Command+Shift+U**) to toggle the side panel.
5. In the popup, selected text is analyzed automatically; if no text is selected, paste Japanese text and click **Analyze**. In the side panel, paste text and click **Analyze**.

The side-panel shortcut only toggles the panel. The popup shortcut analyzes a page selection when one is present; it does not read the clipboard. You can customize shortcuts at `chrome://extensions/shortcuts`. The extension calls OpenAI's Chat Completions API directly; no separate server is needed. The default model is `gpt-4o-mini`. The key is stored locally in Chrome extension storage, is not synced, and is sent directly to OpenAI with each request. The extension does not retain analysis history. Text you submit is sent to OpenAI for analysis. Because the key is available to the extension, use this setup for your own trusted browser profile rather than distributing it as a public extension.

## Project files

- `extension/` — Manifest V3 extension, API-key settings, side panel, and contextual floating popup.
- `extension/sidepanel/logo.svg` — 教えて (Oshiete) logo.
- `design/PLAN.md` — product and implementation plan (kept local and git-ignored).
