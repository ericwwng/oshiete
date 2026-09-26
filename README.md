# Oshiete

Chrome Extension for breaking down Japanese sentences with an AI-powered grammar tutor.

## Install and run

Requirements: Chrome.

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this repository's `extension/` directory.
3. Open the extension's **Details → Extension options** (or click **Settings** in the side panel), paste your OpenAI API key, and optionally enable dark mode under **Appearance**.
4. Choose a presentation mode:
   - Press **Ctrl+Shift+Y** (macOS: **Command+Shift+Y**) to toggle a floating dropdown over the webpage without resizing it.
   - Press **Ctrl+Shift+U** (macOS: **Command+Shift+U**) to toggle the side panel.
5. Paste Japanese text into the chosen UI and click **Analyze** to request an explanation.

Both shortcuts only toggle their respective UI; they do not read the clipboard or start an analysis. Paste text into the panel or dropdown and click **Analyze** when you are ready. You can customize shortcuts at `chrome://extensions/shortcuts`. The extension calls OpenAI's Chat Completions API directly; no separate server is needed. The default model is `gpt-4o-mini`. The key is stored locally in Chrome extension storage, is not synced, and is sent directly to OpenAI with each request. The extension does not retain analysis history. Text you submit is sent to OpenAI for analysis. Because the key is available to the extension, use this setup for your own trusted browser profile rather than distributing it as a public extension.

## Project files

- `extension/` — Manifest V3 extension, API-key settings, side panel, and floating dropdown.
- `extension/sidepanel/logo.svg` — 教えて (Oshiete) logo.
- `design/PLAN.md` — product and implementation plan (kept local and git-ignored).
