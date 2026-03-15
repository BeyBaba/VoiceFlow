// Language-specific prompts for Whisper
const LANGUAGE_PROMPTS = {
  tr: "Bu bir Türkçe konuşma kaydıdır. Lütfen Türkçe olarak yazıya dökün.",
  de: "Dies ist eine deutsche Sprachaufnahme. Bitte auf Deutsch transkribieren.",
  fr: "Ceci est un enregistrement vocal en français. Veuillez transcrire en français.",
  es: "Esta es una grabación de voz en español. Por favor, transcribir en español.",
  ja: "これは日本語の音声録音です。日本語で書き起こしてください。",
  ko: "이것은 한국어 음성 녹음입니다. 한국어로 전사해 주세요.",
  zh: "这是一段中文语音录音。请用中文转录。",
  pt: "Esta é uma gravação de voz em português. Por favor, transcreva em português.",
  it: "Questa è una registrazione vocale in italiano. Si prega di trascrivere in italiano.",
  ru: "Это запись голоса на русском языке. Пожалуйста, транскрибируйте на русском.",
  ar: "هذا تسجيل صوتي باللغة العربية. يرجى النسخ باللغة العربية.",
  en: "",
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
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
let timerInterval = null;
let seconds = 0;

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
  const data = await chrome.storage.local.get(["setupComplete", "apiKey"]);

  if (data.setupComplete) {
    // Setup done → show main screen and auto-start recording
    showMainScreen();

    if (!data.apiKey) {
      // No API key yet → show idle with toast
      showView("idle");
      showToast("Önce Ayarlar'dan API Key girin!");
    } else {
      // Auto-start recording immediately
      startRecording();
    }
  } else {
    // First run → setup flow
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
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    chrome.storage.local.set({ micPermissionGranted: true });
    setupStep1.classList.add("hidden");
    setupStep2.classList.remove("hidden");
  } catch (err) {
    showToast("Mikrofon izni gerekli!");
  }
});

saveLangBtn.addEventListener("click", () => {
  const lang = setupLangSelect.value;
  chrome.storage.local.set({
    language: lang,
    setupComplete: true,
    autoPaste: true,
  });
  // Go to main screen but show idle (need API key)
  showMainScreen();
  showView("idle");
  showToast("Sağ tık → Ayarlar'dan API Key girin");
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

// ========== RECORDING ==========
async function startRecording() {
  const data = await chrome.storage.local.get(["apiKey"]);
  if (!data.apiKey) {
    showView("idle");
    showToast("Önce Ayarlar'dan API Key girin!");
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      await transcribe(audioBlob);
    };

    mediaRecorder.start(250);
    isRecording = true;
    seconds = 0;
    timerEl.textContent = "0:00";
    showView("recording");
    startTimer();
  } catch (err) {
    showView("idle");
    showToast("Mikrofon erişimi yok!");
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    isProcessing = true;
    stopTimer();
    showView("processing");
  }
}

// ========== TRANSCRIBE ==========
async function transcribe(audioBlob) {
  const data = await chrome.storage.local.get(["apiKey", "language"]);
  const apiKey = data.apiKey;
  const language = data.language || "tr";

  if (!apiKey) {
    isProcessing = false;
    showView("idle");
    showToast("API Key gerekli!");
    return;
  }

  try {
    const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", language);
    formData.append("response_format", "verbose_json");
    formData.append("temperature", "0");

    const prompt = LANGUAGE_PROMPTS[language] || "";
    if (prompt) formData.append("prompt", prompt);

    let response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    // Fallback to whisper-large-v3 if turbo fails
    if (!response.ok && response.status !== 401) {
      console.warn("Turbo failed, trying whisper-large-v3...");
      const fb = new FormData();
      fb.append("file", new File([audioBlob], "recording.webm", { type: "audio/webm" }));
      fb.append("model", "whisper-large-v3");
      fb.append("language", language);
      fb.append("response_format", "verbose_json");
      fb.append("temperature", "0");
      if (prompt) fb.append("prompt", prompt);
      response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fb,
      });
    }

    if (!response.ok) {
      console.error("Groq error:", await response.text());
      showToast(response.status === 401 ? "API Key geçersiz!" : "Transkripsiyon hatası!");
      isProcessing = false;
      showView("idle");
      return;
    }

    const result = await response.json();
    const rawText = result.text || "";
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
  } catch (err) {
    console.error("Transcription error:", err);
    showToast("Bağlantı hatası!");
    isProcessing = false;
    showView("idle");
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
