// Language codes for Web Speech API
const LANGUAGE_CODES = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  pt: "pt-BR",
  it: "it-IT",
  ru: "ru-RU",
  ar: "ar-SA",
};

// Filler word patterns per language
const FILLER_PATTERNS = {
  en: [/\b(um|uh|erm|er|ah|like,?\s)/gi, /\b(you know,?\s)/gi, /\b(I mean,?\s)/gi, /\b(basically,?\s)/gi],
  tr: [/\b(ee+|aa+|şey,?\s)/gi, /\b(hani,?\s)/gi, /\b(yani,?\s)/gi, /\b(işte,?\s)/gi, /\b(aslında,?\s)/gi],
  de: [/\b(äh|ähm|em|hm,?\s)/gi, /\b(also,?\s)/gi],
  fr: [/\b(euh|bah|ben,?\s)/gi, /\b(en fait,?\s)/gi],
  es: [/\b(eh|em|este,?\s)/gi, /\b(o sea,?\s)/gi],
};

// State
let recognition = null;
let isRecording = false;
let isProcessing = false;
let timerInterval = null;
let seconds = 0;
let fullTranscript = "";
let interimTranscript = "";

// Elements
const setupScreen = document.getElementById("setupScreen");
const setupStep1 = document.getElementById("setupStep1");
const setupStep2 = document.getElementById("setupStep2");
const grantMicBtn = document.getElementById("grantMicBtn");
const setupLangSelect = document.getElementById("setupLangSelect");
const saveLangBtn = document.getElementById("saveLangBtn");

const mainScreen = document.getElementById("mainScreen");
const recordingView = document.getElementById("recordingView");
const processingView = document.getElementById("processingView");
const resultView = document.getElementById("resultView");
const idleView = document.getElementById("idleView");
const stopBtn = document.getElementById("stopBtn");
const micBtn = document.getElementById("micBtn");
const timerEl = document.getElementById("timer");
const resultText = document.getElementById("resultText");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

// ========== INIT ==========
async function init() {
  // Check Web Speech API support
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    showToast("Bu tarayıcı ses tanımayı desteklemiyor!");
    return;
  }

  const data = await chrome.storage.local.get(["setupComplete"]);

  if (data.setupComplete) {
    showMainScreen();
    // Auto-start recording immediately
    startRecording();
  } else {
    showSetupScreen();
  }
}

// ========== SETUP FLOW ==========
function showSetupScreen() {
  setupScreen.classList.remove("hidden");
  mainScreen.classList.add("hidden");
  setupStep1.classList.remove("hidden");
  setupStep2.classList.add("hidden");
}

grantMicBtn.addEventListener("click", async () => {
  try {
    // Önce getUserMedia dene — popup'ta çalışırsa harika
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    }
    chrome.storage.local.set({ micPermissionGranted: true });
    setupStep1.classList.add("hidden");
    setupStep2.classList.remove("hidden");
  } catch (err) {
    // getUserMedia popup'ta başarısız olabilir (Chrome kısıtlaması)
    // Yine de devam et — SpeechRecognition kendi izin diyaloğunu tetikler
    if (err.name === "NotAllowedError" || err.name === "SecurityError" || err.name === "NotFoundError") {
      console.log("getUserMedia popup'ta çalışmadı, SpeechRecognition ile devam ediliyor");
      chrome.storage.local.set({ micPermissionGranted: true });
      setupStep1.classList.add("hidden");
      setupStep2.classList.remove("hidden");
    } else {
      showToast("Mikrofon izni gerekli!");
    }
  }
});

saveLangBtn.addEventListener("click", () => {
  const lang = setupLangSelect.value;
  chrome.storage.local.set({
    language: lang,
    setupComplete: true,
    autoPaste: true,
  });
  showMainScreen();
  startRecording();
});

// ========== MAIN SCREEN ==========
function showMainScreen() {
  setupScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
}

function showView(name) {
  recordingView.classList.add("hidden");
  processingView.classList.add("hidden");
  resultView.classList.add("hidden");
  idleView.classList.add("hidden");

  if (name === "recording") recordingView.classList.remove("hidden");
  else if (name === "processing") processingView.classList.remove("hidden");
  else if (name === "result") resultView.classList.remove("hidden");
  else if (name === "idle") idleView.classList.remove("hidden");
}

// Stop button
stopBtn.addEventListener("click", () => {
  stopRecording();
});

// Idle mic button
micBtn.addEventListener("click", () => {
  if (!isProcessing && !isRecording) {
    startRecording();
  }
});

// ========== RECORDING (Web Speech API) ==========
async function startRecording() {
  const data = await chrome.storage.local.get(["language"]);
  const language = data.language || "tr";
  const langCode = LANGUAGE_CODES[language] || "tr-TR";

  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = langCode;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    fullTranscript = "";
    interimTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        fullTranscript += final;
      }
      interimTranscript = interim;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        // Mikrofon izni yoksa kullanıcıya adres çubuğundaki izinleri göster
        showToast("Mikrofon izni gerekli! Adres çubuğundaki kilit ikonuna tıklayıp mikrofon iznini verin.");
        isRecording = false;
        isProcessing = false;
        stopTimer();
        showView("idle");
        // Kurulum ekranını tekrar göster
        chrome.storage.local.set({ setupComplete: false, micPermissionGranted: false });
      } else if (event.error === "no-speech") {
        // Silently restart if no speech detected
        if (isRecording) {
          try { recognition.start(); } catch (e) { /* ignore */ }
        }
      }
    };

    recognition.onend = () => {
      // If still recording (auto-ended by browser), restart
      if (isRecording) {
        try { recognition.start(); } catch (e) { /* ignore */ }
        return;
      }

      // Recording was intentionally stopped — process results
      if (isProcessing) {
        processResult();
      }
    };

    recognition.start();
    isRecording = true;
    seconds = 0;
    timerEl.textContent = "0:00";
    showView("recording");
    startTimer();
    // Toolbar ikonunu kırmızıya çevir
    chrome.runtime.sendMessage({ action: "set-icon-active" }).catch(() => {});
  } catch (err) {
    console.error("Recognition start error:", err);
    showView("idle");
    showToast("Ses tanıma başlatılamadı!");
  }
}

function stopRecording() {
  if (recognition && isRecording) {
    isRecording = false;
    isProcessing = true;
    stopTimer();
    showView("processing");
    recognition.stop();
    // Toolbar ikonunu varsayılana döndür
    chrome.runtime.sendMessage({ action: "set-icon-default" }).catch(() => {});
  }
}

// ========== PROCESS RESULT ==========
async function processResult() {
  const data = await chrome.storage.local.get(["language"]);
  const language = data.language || "tr";

  // Combine final + any remaining interim
  let rawText = (fullTranscript + interimTranscript).trim();
  const cleaned = cleanTranscript(rawText, language);

  if (!cleaned) {
    showToast("Ses algılanamadı");
    isProcessing = false;
    showView("idle");
    return;
  }

  // Show result
  resultText.textContent = cleaned;
  isProcessing = false;
  showView("result");

  // Auto-copy to clipboard
  try {
    await navigator.clipboard.writeText(cleaned);
  } catch {
    // ignore
  }

  // Send to content script for double-click paste
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "store-text", text: cleaned });
    }
  });

  // Auto-paste if enabled
  const settings = await chrome.storage.local.get(["autoPaste"]);
  if (settings.autoPaste !== false) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "paste", text: cleaned });
      }
    });
  }
}

// ========== HELPERS ==========
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

function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function showToast(message) {
  toastText.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

// Keyboard shortcut from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggle-recording") {
    if (isProcessing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
});

// Start!
init();
