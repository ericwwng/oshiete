const selection = document.querySelector("#selection");
const button = document.querySelector("#analyze");
const status = document.querySelector("#status");
const result = document.querySelector("#result");
const API_URL = "https://api.openai.com/v1/chat/completions";
const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    original: { type: "string" }, reading: { type: "string" }, translation: { type: "string" },
    pieces: { type: "array", items: { type: "object", properties: { text: { type: "string" }, reading: { type: "string" }, role: { type: "string" }, explanation: { type: "string" }, grammarPoints: { type: "array", items: { type: "object", properties: { pattern: { type: "string" }, meaning: { type: "string" }, example: { type: "string" } }, required: ["pattern", "meaning", "example"], additionalProperties: false } }, pitfalls: { type: "array", items: { type: "string" } } }, required: ["text", "reading", "role", "explanation", "grammarPoints", "pitfalls"], additionalProperties: false } },
    vocabulary: { type: "array", items: { type: "object", properties: { word: { type: "string" }, reading: { type: "string" }, meaning: { type: "string" } }, required: ["word", "reading", "meaning"], additionalProperties: false } }
  },
  required: ["original", "reading", "translation", "pieces", "vocabulary"],
  additionalProperties: false
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function render(data) {
  const pieces = (data.pieces || []).map((piece) => `
    <article class="card"><div class="jp">${escapeHtml(piece.text)}</div>
      ${piece.reading ? `<div class="muted">${escapeHtml(piece.reading)}</div>` : ""}
      <strong>${escapeHtml(piece.role || "")}</strong><div>${escapeHtml(piece.explanation || "")}</div>
      ${(piece.grammarPoints || []).map((point) => `<div class="grammar-inline"><strong>${escapeHtml(point.pattern)}</strong> — ${escapeHtml(point.meaning)}${point.example ? ` <span class="muted">(${escapeHtml(point.example)})</span>` : ""}</div>`).join("")}
      ${(piece.pitfalls || []).map((note) => `<div class="grammar-inline learner-note"><strong>Learner note:</strong> ${escapeHtml(note)}</div>`).join("")}</article>`).join("");
  const vocab = (data.vocabulary || []).map((word) => `<li><strong>${escapeHtml(word.word || word.text)}</strong>${word.reading ? ` (${escapeHtml(word.reading)})` : ""} — ${escapeHtml(word.meaning || word.definition || "")}</li>`).join("");
  result.innerHTML = `<div class="card"><div class="jp">${escapeHtml(data.original || "")}</div><div>${escapeHtml(data.reading || "")}</div><p>${escapeHtml(data.translation || "")}</p></div>
    ${pieces ? `<h2>How the sentence fits together</h2>${pieces}` : ""}
    ${vocab ? `<details class="vocabulary"><summary>Key vocabulary</summary><ul>${vocab}</ul></details>` : ""}`;
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
          { role: "system", content: "You are a patient Japanese grammar tutor for English-speaking learners. Prioritize grammar over vocabulary: explain sentence structure, particles, how clauses connect, and verb/adjective conjugations in useful detail. Explain vocabulary only when a word is essential to understanding a grammar point; do not produce a general word list. Note ambiguity rather than guessing." },
          { role: "user", content: `Analyze the Japanese text below as a grammar lesson. Give its kana reading and natural English translation, then break it into meaningful grammatical chunks. For each chunk, explain its role and attach any recognizable common grammar pattern that applies specifically to that chunk, with its meaning and a short example. Do not list grammar points separately from their chunk. Put any relevant learner warning directly on the chunk it applies to; omit generic warnings that do not apply to a specific chunk. Keep vocabulary minimal and only include words needed to clarify grammar.\n\n${text}` }
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

function applyTheme(enabled) {
  document.body.classList.toggle("dark", Boolean(enabled));
}

chrome.storage.local.get("darkMode", ({ darkMode }) => applyTheme(darkMode));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.darkMode) applyTheme(changes.darkMode.newValue);
});

button.addEventListener("click", analyze);
selection.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") analyze();
});
