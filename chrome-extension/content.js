// Content script - handles pasting text, double-click paste, and bottom pill bar

// Store the last transcribed text for double-click paste
let lastTranscribedText = "";

// ========== FLOATING BOTTOM PILL ==========
function createBottomPill() {
  // Don't add on extension pages
  if (location.protocol === "chrome-extension:" || location.protocol === "chrome:") return;

  // Hover zone (bigger invisible area)
  const zone = document.createElement("div");
  zone.id = "vf-pill-zone";
  zone.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 60px;
    z-index: 2147483647;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 12px;
    pointer-events: auto;
  `;

  // The pill itself
  const pill = document.createElement("div");
  pill.id = "vf-pill";
  pill.style.cssText = `
    width: 48px;
    height: 5px;
    border-radius: 3px;
    background: #292524;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 0px;
    color: white;
    font-weight: 600;
    user-select: none;
  `;

  zone.appendChild(pill);
  document.body.appendChild(zone);

  // Hover → expand
  zone.addEventListener("mouseenter", () => {
    pill.style.width = "260px";
    pill.style.height = "38px";
    pill.style.borderRadius = "19px";
    pill.style.background = "linear-gradient(135deg, #0F766E, #0D9488)";
    pill.style.boxShadow = "0 8px 24px rgba(15, 118, 110, 0.4)";
    pill.style.fontSize = "13px";
    pill.textContent = "🎤 Ctrl+Space ile dikte et";
  });

  // Mouse leave → shrink
  zone.addEventListener("mouseleave", () => {
    pill.style.width = "48px";
    pill.style.height = "5px";
    pill.style.borderRadius = "3px";
    pill.style.background = "#292524";
    pill.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    pill.style.fontSize = "0px";
    pill.textContent = "";
  });

  // Click → open extension popup (can't directly, so trigger shortcut message)
  pill.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "open-popup" });
  });
}

// Inject pill when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createBottomPill);
} else {
  createBottomPill();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "paste") {
    pasteText(message.text);
  }
  if (message.action === "store-text") {
    lastTranscribedText = message.text;
  }
});

// Double-click to paste: when user double-clicks on any text input, paste the last transcribed text
document.addEventListener("dblclick", (e) => {
  if (!lastTranscribedText) return;

  const el = e.target;

  // Only paste into editable elements
  const isInput = el.tagName === "INPUT" && !["hidden", "checkbox", "radio", "submit", "button", "file", "image", "reset"].includes(el.type);
  const isTextarea = el.tagName === "TEXTAREA";
  const isEditable = el.isContentEditable || el.getAttribute("contenteditable") === "true";

  if (isInput || isTextarea || isEditable) {
    e.preventDefault();
    const textWithSpace = lastTranscribedText + " ";

    if (isInput || isTextarea) {
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const value = el.value;
      el.value = value.slice(0, start) + textWithSpace + value.slice(end);
      el.selectionStart = el.selectionEnd = start + textWithSpace.length;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (isEditable) {
      document.execCommand("insertText", false, textWithSpace);
    }

    // Clear after paste so it doesn't paste again
    lastTranscribedText = "";
  }
});

// Direct paste function (called from popup auto-paste)
function pasteText(text) {
  const activeEl = document.activeElement;
  // Dikté sonrası otomatik boşluk ekle
  const textWithSpace = text + " ";

  if (!activeEl) return;

  // Handle input and textarea elements
  if (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") {
    const start = activeEl.selectionStart || 0;
    const end = activeEl.selectionEnd || 0;
    const value = activeEl.value;
    activeEl.value = value.slice(0, start) + textWithSpace + value.slice(end);
    activeEl.selectionStart = activeEl.selectionEnd = start + textWithSpace.length;
    activeEl.dispatchEvent(new Event("input", { bubbles: true }));
    activeEl.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  // Handle contentEditable elements (Google Docs, Notion, Slack, etc.)
  if (activeEl.isContentEditable || activeEl.getAttribute("contenteditable") === "true") {
    document.execCommand("insertText", false, textWithSpace);
    return;
  }

  // Fallback: try to find the nearest editable element
  const editables = document.querySelectorAll(
    'input:not([type="hidden"]):not([readonly]), textarea:not([readonly]), [contenteditable="true"]'
  );

  for (const el of editables) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      el.focus();
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.value += textWithSpace;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        document.execCommand("insertText", false, textWithSpace);
      }
      break;
    }
  }
}
