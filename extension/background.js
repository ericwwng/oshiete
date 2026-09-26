chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "analyze-japanese-selection" || !tab?.id) return;
  const tabId = tab.id;
  const stateKey = `sidePanelOpen:${tabId}`;

  try {
    const state = await chrome.storage.session.get(stateKey);
    if (state[stateKey]) {
      // Chrome's Side Panel API has no direct close() method. Disabling it
      // closes the visible panel; re-enable it so the next shortcut can open it.
      await chrome.sidePanel.setOptions({ tabId, enabled: false });
      await chrome.sidePanel.setOptions({ tabId, enabled: true });
      await chrome.storage.session.remove(stateKey);
    } else {
      await chrome.sidePanel.setOptions({ tabId, enabled: true });
      await chrome.sidePanel.open({ tabId });
      await chrome.storage.session.set({ [stateKey]: true });
    }
  } catch (error) {
    console.error("Could not toggle side panel:", error);
  }
});
