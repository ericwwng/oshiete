# Oshiete

Chrome Extension for breaking down Japanese sentences with an AI-powered grammar tutor.

## Run locally

Requirements: Chrome and Node.js 18+.

1. Start the analysis backend:

   ```sh
   node server/server.js
   ```

   Optional configuration: `PORT` (default `8787`), `LLM_MODEL` (default `gpt-4o-mini`), `LLM_API_URL` (default OpenAI chat completions URL), and `MAX_TEXT_LENGTH` (default `2000`). `LLM_API_URL` should be a compatible chat-completions endpoint supporting JSON Schema response format.

2. Load the extension in Chrome:
   - Open `chrome://extensions`.
   - Enable **Developer mode**.
   - Choose **Load unpacked** and select this repository's `extension/` directory.
3. Open the extension's **Details → Extension options** (or use the **Settings** link in the side panel) and paste your OpenAI API key.
4. Open a webpage containing Japanese, select text, and press **Ctrl+Shift+Y** (macOS: **Command+Shift+Y**). The side panel opens and starts analysis. You can also edit the text and use **Analyze**.

Change the shortcut at `chrome://extensions/shortcuts`. The key is stored locally in Chrome extension storage, not synced, and sent to the local backend with each analysis request. The extension does not retain analysis history. Selected text is also sent to the configured language-model provider.

## Project files

- `extension/` — Manifest V3 extension and side panel UI.
- `server/server.js` — minimal Node.js backend proxy; keeps the provider key out of the extension.
- `PLAN.md` — product and implementation plan.
