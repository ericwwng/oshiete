const selection = document.querySelector("#selection");
const button = document.querySelector("#analyze");
const status = document.querySelector("#status");
const result = document.querySelector("#result");
const API_URL = "http://localhost:8787/analyze";
let latestSelectionId;

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
      method: "POST", headers: { "Content-Type": "application/json", "X-OpenAI-API-Key": openaiApiKey },
      body: JSON.stringify({ text })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    render(body);
    status.textContent = "";
  } catch (error) {
    status.textContent = `${error.message}. Is the local analysis server running?`;
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
