// Create right-click context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "voiceflow-settings",
    title: "⚙️ Ayarlar",
    contexts: ["action"], // Shows when right-clicking the extension icon
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "voiceflow-settings") {
    chrome.runtime.openOptionsPage();
  }
});

// Handle keyboard shortcut (Ctrl+Space)
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-recording") {
    // Send message to popup if open
    chrome.runtime.sendMessage({ action: "toggle-recording" }).catch(() => {
      // Popup not open - open it
      chrome.action.openPopup().catch(() => {
        // openPopup not supported in all contexts, ignore
      });
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "get-settings") {
    chrome.storage.local.get(["apiKey", "language", "autoPaste"], (data) => {
      sendResponse(data);
    });
    return true; // async response
  }
});
