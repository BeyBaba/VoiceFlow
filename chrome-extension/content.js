// Content script - handles pasting text, double-click paste, keyboard shortcut recording, and bottom pill bar

// Store the last transcribed text for double-click paste
let lastTranscribedText = "";

// ========== IN-PAGE RECORDING (Ctrl+Space) ==========
let pageRecognition = null;
let pageIsRecording = false;
let pageFullTranscript = "";
let pageInterimTranscript = "";
let recordingOverlay = null;

// Language codes for Web Speech API
const LANGUAGE_CODES = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
  ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", pt: "pt-BR", it: "it-IT",
  ru: "ru-RU", ar: "ar-SA",
};

// Filler word patterns per language
const FILLER_PATTERNS = {
  en: [/\b(um|uh|erm|er|ah|like,?\s)/gi, /\b(you know,?\s)/gi, /\b(I mean,?\s)/gi],
  tr: [/\b(ee+|aa+|şey,?\s)/gi, /\b(hani,?\s)/gi, /\b(yani,?\s)/gi, /\b(işte,?\s)/gi],
  de: [/\b(äh|ähm|em|hm,?\s)/gi],
  fr: [/\b(euh|bah|ben,?\s)/gi],
  es: [/\b(eh|em|este,?\s)/gi],
};

function createRecordingOverlay() {
  if (recordingOverlay) return;

  recordingOverlay = document.createElement("div");
  recordingOverlay.id = "vf-recording-overlay";
  recordingOverlay.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0F766E, #0D9488);
    color: white;
    padding: 10px 24px;
    border-radius: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 2147483647;
    box-shadow: 0 8px 32px rgba(15, 118, 110, 0.5);
    cursor: pointer;
    user-select: none;
    animation: vfSlideUp 0.3s ease;
  `;
  recordingOverlay.innerHTML = `
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#EF4444;animation:vfPulse 1.2s infinite"></span>
    <span>Dinleniyor... (Ctrl+Space durdur)</span>
  `;

  // Add animations
  const style = document.createElement("style");
  style.id = "vf-recording-styles";
  style.textContent = `
    @keyframes vfSlideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
    @keyframes vfPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(recordingOverlay);

  // Click to stop
  recordingOverlay.addEventListener("click", () => stopPageRecording());
}

function removeRecordingOverlay() {
  if (recordingOverlay) {
    recordingOverlay.remove();
    recordingOverlay = null;
  }
  const style = document.getElementById("vf-recording-styles");
  if (style) style.remove();
}

function cleanTranscript(text, language) {
  if (!text) return "";
  let cleaned = text;
  const patterns = FILLER_PATTERNS[language] || FILLER_PATTERNS.en || [];
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  if (cleaned && !/[.!?]$/.test(cleaned)) {
    cleaned += ".";
  }
  return cleaned;
}

async function startPageRecording() {
  if (pageIsRecording) {
    stopPageRecording();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showPageToast("Bu tarayıcı ses tanımayı desteklemiyor!");
    return;
  }

  const data = await chrome.storage.local.get(["language"]);
  const language = data.language || "tr";
  const langCode = LANGUAGE_CODES[language] || "tr-TR";

  pageRecognition = new SpeechRecognition();
  pageRecognition.lang = langCode;
  pageRecognition.continuous = true;
  pageRecognition.interimResults = true;
  pageRecognition.maxAlternatives = 1;

  pageFullTranscript = "";
  pageInterimTranscript = "";

  pageRecognition.onresult = (event) => {
    let final = "";
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }
    if (final) pageFullTranscript += final;
    pageInterimTranscript = interim;
  };

  pageRecognition.onerror = (event) => {
    if (event.error === "not-allowed") {
      showPageToast("Mikrofon izni gerekli! Adres çubuğundaki kilit ikonuna tıklayın.");
      pageIsRecording = false;
      removeRecordingOverlay();
      chrome.runtime.sendMessage({ action: "set-icon-default" }).catch(() => {});
    } else if (event.error === "no-speech") {
      if (pageIsRecording) {
        try { pageRecognition.start(); } catch (e) { /* ignore */ }
      }
    }
  };

  pageRecognition.onend = () => {
    if (pageIsRecording) {
      try { pageRecognition.start(); } catch (e) { /* ignore */ }
      return;
    }
    // Recording stopped — process
    processPageResult(language);
  };

  try {
    pageRecognition.start();
    pageIsRecording = true;
    createRecordingOverlay();
    chrome.runtime.sendMessage({ action: "set-icon-active" }).catch(() => {});
  } catch (err) {
    showPageToast("Ses tanıma başlatılamadı!");
  }
}

function stopPageRecording() {
  if (pageRecognition && pageIsRecording) {
    pageIsRecording = false;
    removeRecordingOverlay();
    pageRecognition.stop();
    chrome.runtime.sendMessage({ action: "set-icon-default" }).catch(() => {});
  }
}

async function processPageResult(language) {
  let rawText = (pageFullTranscript + pageInterimTranscript).trim();
  const cleaned = cleanTranscript(rawText, language);

  if (!cleaned) {
    showPageToast("Ses algılanamadı");
    return;
  }

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(cleaned);
  } catch {
    // ignore
  }

  // Store for double-click paste
  lastTranscribedText = cleaned;

  // Auto-paste into active element
  const settings = await chrome.storage.local.get(["autoPaste"]);
  if (settings.autoPaste !== false) {
    pasteText(cleaned);
  }

  showPageToast("✅ Kopyalandı: " + cleaned.substring(0, 40) + (cleaned.length > 40 ? "..." : ""));
}

function showPageToast(message) {
  // Remove existing toast
  const existing = document.getElementById("vf-page-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "vf-page-toast";
  toast.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    background: #1C1917;
    color: #E7E5E4;
    padding: 10px 18px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    z-index: 2147483647;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    border: 1px solid #2A2A36;
    animation: vfSlideUp 0.2s ease;
    max-width: 350px;
    word-break: break-word;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

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

  // Click → toggle recording
  pill.addEventListener("click", () => {
    startPageRecording();
  });
}

// Inject pill when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createBottomPill);
} else {
  createBottomPill();
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "paste") {
    pasteText(message.text);
  }
  if (message.action === "store-text") {
    lastTranscribedText = message.text;
  }
  if (message.action === "toggle-recording") {
    startPageRecording();
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
