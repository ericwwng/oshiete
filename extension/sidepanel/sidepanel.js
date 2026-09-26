const selection = document.querySelector("#selection");
const button = document.querySelector("#analyze");
const status = document.querySelector("#status");
const result = document.querySelector("#result");
const API_URL = "https://api.openai.com/v1/chat/completions";
let latestSelectionId;

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    original: { type: "string" }, reading: { type: "string" }, translation: { type: "string" },
    pieces: { type: "array", items: { type: "object", properties: { text: { type: "string" }, reading: { type: "string" }, role: { type: "string" }, explanation: { type: "string" } }, required: ["text", "role", "explanation"], additionalProperties: false } },
    grammarPoints: { type: "array", items: { type: "object", properties: { pattern: { type: "string" }, meaning: { type: "string" }, example: { type: "string" } }, required: ["pattern", "meaning", "example"], additionalProperties: false } },
    vocabulary: { type: "array", items: { type: "object", properties: { word: { type: "string" }, reading: { type: "string" }, meaning: { type: "string" } }, required: ["word", "reading", "meaning"], additionalProperties: false } },
    pitfalls: { type: "array", items: { type: "string" } }
  },
  required: ["original", "reading", "translation", "pieces", "grammarPoints", "vocabulary", "pitfalls"],
  additionalProperties: false
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function render(data) {
  const pieces = (data.pieces || []).map((piece) => `
    <article class="card"><div class="jp">${escapeHtml(piece.text)}</div>
      ${piece.reading ? `<div class="muted">${escapeHtml(piece.reading)}</div>` : ""}
      <strong>${escapeHtml(piece.role || "")}</strong><div>${escapeHtml(piece.explanation || "")}</div></article>`).join("");
  const grammar = (data.grammarPoints || []).map((point) => `<li><strong>${escapeHtml(point.pattern)}</strong> — ${escapeHtml(point.meaning)}${point.example ? `<br><span class="muted">${escapeHtml(point.example)}</span>` : ""}</li>`).join("");
  const vocab = (data.vocabulary || []).map((word) => `<li><strong>${escapeHtml(word.word || word.text)}</strong>${word.reading ? ` (${escapeHtml(word.reading)})` : ""} — ${escapeHtml(word.meaning || word.definition || "")}</li>`).join("");
  result.innerHTML = `<div class="card"><div class="jp">${escapeHtml(data.original || "")}</div><div>${escapeHtml(data.reading || "")}</div><p>${escapeHtml(data.translation || "")}</p></div>
    ${pieces ? `<h2>Sentence breakdown</h2>${pieces}` : ""}
    ${grammar ? `<h2>Grammar</h2><ul>${grammar}</ul>` : ""}
    ${vocab ? `<h2>Vocabulary</h2><ul>${vocab}</ul>` : ""}
    ${data.pitfalls?.length ? `<h2>Watch out</h2><ul>${data.pitfalls.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}`;
}

async function analyze() {
  const text = selection.value.trim();
  if (!text) { status.textContent = "Select or enter some Japanese text first."; return; }
  const { openaiApiKey } = await chrome.storage.local.get("openaiApiKey");
  if (!openaiApiKey) {
    status.innerHTML = 'Add your OpenAI key in <a href="../options/index.html" target="_blank">Settings</a> to get started.';
    return;
  }
  button.disabled = true;
  result.replaceChildren();
  status.textContent = "Analyzing…";
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiApiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a patient Japanese grammar tutor. Explain Japanese for an English-speaking learner. Be precise about particles, phrase roles, and conjugation; note ambiguity rather than guessing." },
          { role: "user", content: `Analyze the text below. Give its kana reading, natural English translation, phrase-by-phrase breakdown with each phrase's role and explanation, grammar patterns with examples, vocabulary, and common learner pitfalls. Keep the explanation clear and concise.\n\n${text}` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "japanese_analysis", strict: true, schema: analysisSchema } }
      })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message || `Request failed (${response.status})`);
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error("The model returned an empty response.");
    render(JSON.parse(content));
    status.textContent = "";
  } catch (error) {
    status.textContent = `${error.message}. Check your API key and connection.`;
  } finally { button.disabled = false; }
}

button.addEventListener("click", analyze);
selection.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") analyze();
});

async function loadSelection() {
  const stored = await chrome.storage.session.get(["selectedText", "selectionId"]);
  if (stored.selectionId === latestSelectionId) return;
  latestSelectionId = stored.selectionId;
  if (stored.selectedText) {
    selection.value = stored.selectedText;
    await analyze();
  } else {
    selection.value = "";
    result.replaceChildren();
    status.textContent = "No text was selected. Highlight Japanese text and try again.";
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && (changes.selectionId || changes.selectedText)) loadSelection();
});
loadSelection();
