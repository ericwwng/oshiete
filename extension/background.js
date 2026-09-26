chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "analyze-japanese-selection" || !tab?.id) return;
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
