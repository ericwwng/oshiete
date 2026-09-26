chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "analyze-japanese-selection" || !tab?.id) return;

  try {
    const [{ result: selectedText = "" } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString().trim() || ""
    });
    await chrome.storage.session.set({ selectedText, selectionId: Date.now() });
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error("Could not read selection or open side panel:", error);
  }
});
