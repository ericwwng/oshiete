const input = document.querySelector("#apiKey");
const status = document.querySelector("#status");

chrome.storage.local.get("openaiApiKey", ({ openaiApiKey }) => {
  input.value = openaiApiKey || "";
});

document.querySelector("#save").addEventListener("click", async () => {
  const key = input.value.trim();
  if (!key) { status.textContent = "Paste an API key before saving."; return; }
  await chrome.storage.local.set({ openaiApiKey: key });
  status.textContent = "API key saved on this device.";
});

document.querySelector("#clear").addEventListener("click", async () => {
  await chrome.storage.local.remove("openaiApiKey");
  input.value = "";
  status.textContent = "API key cleared.";
});
