chrome.commands.onCommand.addListener((command, tab) => {
  if (!tab?.id) return;
  if (command === "toggle-analysis-dropdown") {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["dropdown.js"] })
      .catch((error) => console.error("Could not toggle analysis dropdown:", error));
    return;
  }
  if (command !== "analyze-japanese-selection") return;
  const tabId = tab.id;
  const stateKey = `sidePanelOpen:${tabId}`;

  // Invoke open synchronously in the command callback while Chrome's user
  // gesture is active. Awaiting storage first causes Chrome to reject open().
  const openRequest = chrome.sidePanel.open({ tabId }).then(() => null, (error) => error);
  (async () => {
    try {
      const state = await chrome.storage.session.get(stateKey);
      if (state[stateKey]) {
        // Chrome's Side Panel API has no direct close() method. Disabling it
        // closes the visible panel; re-enable it so the next shortcut can open it.
        const openError = await openRequest;
        if (openError) throw openError;
        await chrome.sidePanel.setOptions({ tabId, enabled: false });
        await chrome.sidePanel.setOptions({ tabId, enabled: true });
        await chrome.storage.session.remove(stateKey);
      } else {
        const openError = await openRequest;
        if (openError) throw openError;
        await chrome.storage.session.set({ [stateKey]: true });
      }
    } catch (error) {
      console.error("Could not toggle side panel:", error);
    }
  })();
});

const analysisSchema = {
  type: "object", additionalProperties: false,
  properties: {
    original: { type: "string" }, reading: { type: "string" }, translation: { type: "string" },
    pieces: { type: "array", items: { type: "object", properties: { text: { type: "string" }, reading: { type: "string" }, role: { type: "string" }, explanation: { type: "string" }, grammarPoints: { type: "array", items: { type: "object", properties: { pattern: { type: "string" }, meaning: { type: "string" }, example: { type: "string" } }, required: ["pattern", "meaning", "example"], additionalProperties: false } } }, required: ["text", "reading", "role", "explanation", "grammarPoints"], additionalProperties: false } },
    vocabulary: { type: "array", items: { type: "object", properties: { word: { type: "string" }, reading: { type: "string" }, meaning: { type: "string" } }, required: ["word", "reading", "meaning"], additionalProperties: false } },
    pitfalls: { type: "array", items: { type: "string" } }
  }, required: ["original", "reading", "translation", "pieces", "vocabulary", "pitfalls"],
  additionalProperties: false
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "OSHIETE_ANALYZE") return;
  (async () => {
    try {
      const { openaiApiKey } = await chrome.storage.local.get("openaiApiKey");
      if (!openaiApiKey) throw new Error("Add your OpenAI API key in extension Settings first.");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiApiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a patient Japanese grammar tutor for English-speaking learners. Prioritize grammar over vocabulary: explain sentence structure, particles, clauses, and conjugations. Keep vocabulary minimal and only explain words needed for grammar. Note ambiguity rather than guessing." },
            { role: "user", content: `Explain the grammar in this Japanese text. Break it into meaningful grammatical chunks, explain each chunk's role, and attach any recognizable common grammar pattern to the specific chunk it applies to, including the pattern's meaning and a short example. Do not provide a separate global grammar list. Include reading, translation, and learner pitfalls; keep vocabulary minimal.\n\n${message.text}` }
          ],
          response_format: { type: "json_schema", json_schema: { name: "japanese_analysis", strict: true, schema: analysisSchema } }
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || `OpenAI request failed (${response.status})`);
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("The model returned an empty response.");
      sendResponse({ data: JSON.parse(content) });
    } catch (error) {
      sendResponse({ error: error.message || "Analysis failed." });
    }
  })();
  return true;
});
