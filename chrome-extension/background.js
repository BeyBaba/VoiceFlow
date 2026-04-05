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

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "get-settings") {
    chrome.storage.local.get(["language", "autoPaste"], (data) => {
      sendResponse(data);
    });
    return true; // async response
  }

  // Toggle toolbar icon between active (red) and default (teal)
  if (message.action === "set-icon-active") {
    chrome.action.setIcon({
      path: {
        "16": "icons/icon16-active.png",
        "48": "icons/icon48-active.png",
        "128": "icons/icon128-active.png",
      },
    });
  }
  if (message.action === "set-icon-default") {
    chrome.action.setIcon({
      path: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png",
      },
    });
  }
});
