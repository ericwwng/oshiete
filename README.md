# Oshiete

Chrome Extension for breaking down Japanese sentences with an AI-powered grammar tutor.

## Install and run

Requirements: Chrome.

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this repository's `extension/` directory.
3. Open the extension's **Details → Extension options** (or click **Settings** in the side panel) and paste your OpenAI API key.
4. Select Japanese text on a webpage and press **Ctrl+Shift+Y** (macOS: **Command+Shift+Y**). The side panel opens and starts analysis. You can also edit the text and use **Analyze**.

The extension calls OpenAI's Chat Completions API directly; no separate server is needed. The default model is `gpt-4o-mini`. The key is stored locally in Chrome extension storage, is not synced, and is sent directly to OpenAI with each request. The extension does not retain analysis history. Your selected text is sent to OpenAI for analysis. Because the key is available to the extension, use this setup for your own trusted browser profile rather than distributing it as a public extension.

## Project files

- `extension/` — Manifest V3 extension and side panel UI.
- `server/server.js` — minimal Node.js backend proxy; keeps the provider key out of the extension.
- `PLAN.md` — product and implementation plan.
