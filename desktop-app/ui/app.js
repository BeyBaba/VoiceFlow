// ==================== EMBEDDED API KEY ====================
const EMBEDDED_API_KEY = "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";

function isPremiumAvailable(settings) {
  if (settings.isPro) return true;
  if (settings.trialActive && settings.trialDaysLeft > 0) return true;
  if (settings.trialEndDate) {
    return new Date(settings.trialEndDate) > new Date();
  }
  // Grace: if authenticated but no trial info yet (offline first launch), allow
  if (settings.isAuthenticated && !settings.trialEndDate) return true;
  return false;
}

// ==================== LANGUAGE CONFIG ====================
const LANGUAGE_PROMPTS = {
  tr: "Bu bir Turkce konusma kaydidir. Lutfen Turkce olarak yaziya dokun.",
  de: "Dies ist eine deutsche Sprachaufnahme. Bitte auf Deutsch transkribieren.",
  fr: "Ceci est un enregistrement vocal en francais. Veuillez transcrire en francais.",
  es: "Esta es una grabacion de voz en espanol. Por favor, transcribir en espanol.",
  ja: "これは日本語の音声録音です。日本語で書き起こしてください。",
  ko: "이것은 한국어 음성 녹음입니다. 한국어로 전사해 주세요.",
  zh: "这是一段中文语音录音。请用中文转录。",
  pt: "Esta e uma gravacao de voz em portugues. Por favor, transcreva em portugues.",
  it: "Questa e una registrazione vocale in italiano. Si prega di trascrivere in italiano.",
  ru: "Это запись голоса на русском языке. Пожалуйста, транскрибируйте на русском.",
  ar: "هذا تسجيل صوتي باللغة العربية. يرجى النسخ باللغة العربية.",
  en: "",
};

const LANGUAGE_NAMES = {
  tr: "Turkce", en: "English", de: "Deutsch", fr: "Francais",
  es: "Espanol", ja: "Japanese", ko: "Korean", zh: "Chinese",
  pt: "Portugues", it: "Italiano", ru: "Russian", ar: "Arabic",
};

const FILLER_PATTERNS = {
  en: [/\b(um|uh|erm|er|ah|like,?\s)/gi, /\b(you know,?\s)/gi, /\b(I mean,?\s)/gi, /\b(basically,?\s)/gi],
  tr: [/\b(ee+|aa+|sey,?\s)/gi, /\b(hani,?\s)/gi, /\b(yani,?\s)/gi, /\b(iste,?\s)/gi, /\b(aslinda,?\s)/gi],
  de: [/\b(ah|ahm|em|hm,?\s)/gi, /\b(also,?\s)/gi],
  fr: [/\b(euh|bah|ben,?\s)/gi, /\b(en fait,?\s)/gi],
  es: [/\b(eh|em|este,?\s)/gi, /\b(o sea,?\s)/gi],
};

// ==================== STATE ====================
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
let timerInterval = null;
let seconds = 0;
let cachedSettings = null;
let currentOnboardingStep = 0;
let micTestStream = null;
let micTestAnalyser = null;
let micTestAnimFrame = null;
let selectedLang = "tr";
let audioCtxForSounds = null;

// ==================== ELEMENTS ====================
const onboarding = document.getElementById("onboarding");
const recordingView = document.getElementById("recordingView");
const processingView = document.getElementById("processingView");
const resultView = document.getElementById("resultView");
const idleView = document.getElementById("idleView");
const timerEl = document.getElementById("timer");
const resultText = document.getElementById("resultText");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

// ==================== SOUND EFFECTS ====================
function getAudioContext() {
  if (!audioCtxForSounds || audioCtxForSounds.state === "closed") {
    audioCtxForSounds = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtxForSounds.state === "suspended") {
    audioCtxForSounds.resume();
  }
  return audioCtxForSounds;
}

// Bleep sound — short ascending tone when recording starts
function playStartSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.log("Sound error:", e);
  }
}

// Ding sound — two-tone chime when transcription is complete
function playCompleteSound() {
  try {
    const ctx = getAudioContext();

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // Second tone (higher, slight delay)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.log("Sound error:", e);
  }
}

// ==================== TYPING ANIMATION ====================
let typingTimer = null;

function showResultWithTyping(text) {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }

  const words = text.split(" ");
  let currentIdx = 0;
  resultText.textContent = "";

  // Show result view immediately
  showView("result");
  window.voiceflow.resizeWindow(380, 140);

  typingTimer = setInterval(() => {
    if (currentIdx < words.length) {
      resultText.textContent += (currentIdx > 0 ? " " : "") + words[currentIdx];
      currentIdx++;

      // Dynamically resize as text grows
      const lines = Math.ceil(resultText.textContent.length / 38);
      const height = Math.min(Math.max(130, 80 + lines * 24), 280);
      window.voiceflow.resizeWindow(380, height);
    } else {
      clearInterval(typingTimer);
      typingTimer = null;
    }
  }, 60); // 60ms per word — fast but visible

  return new Promise((resolve) => {
    const checkDone = setInterval(() => {
      if (currentIdx >= words.length) {
        clearInterval(checkDone);
        resolve();
      }
    }, 50);
  });
}

// ==================== INIT ====================
async function init() {
  try {
    cachedSettings = await window.voiceflow.getSettings();
    console.log("Settings loaded:", cachedSettings);

    // Auto-set embedded API key if not already set
    if (!cachedSettings.apiKey) {
      cachedSettings = await window.voiceflow.saveSettings({ apiKey: EMBEDDED_API_KEY });
    }

    if (cachedSettings.setupComplete) {
      showView("idle");
      window.voiceflow.resizeWindow(380, 100);

      // Check if trial expired for free users — show visual indicator
      if (!cachedSettings.isPro && cachedSettings.trialEndDate) {
        const trialEnd = new Date(cachedSettings.trialEndDate);
        if (trialEnd <= new Date()) {
          showToast("Deneme sureniz doldu — Pro'ya yukseltin");
        }
      }
    } else {
      showView("onboarding");
      window.voiceflow.resizeWindow(420, 560);
    }
  } catch (err) {
    console.error("Init error:", err);
    showView("onboarding");
    window.voiceflow.resizeWindow(420, 560);
  }
}

// ==================== VIEW MANAGEMENT ====================
function showView(name) {
  onboarding.classList.add("hidden");
  recordingView.classList.add("hidden");
  processingView.classList.add("hidden");
  resultView.classList.add("hidden");
  idleView.classList.add("hidden");

  if (name === "onboarding") onboarding.classList.remove("hidden");
  else if (name === "recording") recordingView.classList.remove("hidden");
  else if (name === "processing") processingView.classList.remove("hidden");
  else if (name === "result") resultView.classList.remove("hidden");
  else if (name === "idle") idleView.classList.remove("hidden");
}

// ==================== ONBOARDING ====================
function goToStep(stepNum) {
  // Skip Step 1 (API Key) — key is embedded
  if (stepNum === 1) stepNum = 2;

  const steps = document.querySelectorAll(".ob-step");
  const goingBack = stepNum < currentOnboardingStep;

  // Clean up mic test if leaving step 3
  if (currentOnboardingStep === 3) {
    stopMicTest();
  }

  // Handle non-target steps
  steps.forEach((step, i) => {
    if (i === stepNum) return; // Handle target separately
    step.classList.remove("active", "prev");
    if (i < stepNum) {
      step.classList.add("prev");
    }
  });

  // Handle target step with proper direction
  const target = steps[stepNum];
  target.classList.remove("active");

  if (goingBack) {
    // Going backward: start from left (prev), then animate to center
    target.classList.add("prev");
  } else {
    // Going forward: start from right (default), then animate to center
    target.classList.remove("prev");
  }

  // Animate target to active position after a frame
  setTimeout(() => {
    target.classList.remove("prev");
    target.classList.add("active");
  }, 30);

  currentOnboardingStep = stepNum;

  // Step-specific actions
  if (stepNum === 3) {
    const micBtn = document.getElementById("obMicBtn");
    micBtn.classList.remove("listening", "success");
    document.getElementById("obMicStatus").textContent = "Tiklayin ve konusmaya baslayin";
    document.getElementById("obMicStatus").className = "ob-mic-status";
    document.getElementById("obLevelBar").style.width = "0%";
  }

  if (stepNum === 4) {
    document.getElementById("obReadyLang").textContent = LANGUAGE_NAMES[selectedLang] || selectedLang;
    setTimeout(() => createConfetti(), 300);
  }
}

// API Key validation - Step 1
const obApiKeyInput = document.getElementById("obApiKey");
const obApiBtn = document.getElementById("obApiBtn");

if (obApiKeyInput) {
  obApiKeyInput.addEventListener("input", () => {
    const val = obApiKeyInput.value.trim();
    obApiBtn.disabled = !val || val.length < 10;
    obApiKeyInput.classList.remove("error");
  });
}

function validateAndGoStep2() {
  const apiKey = obApiKeyInput.value.trim();

  if (!apiKey) {
    obApiKeyInput.classList.add("error");
    showToast("API Key gerekli!");
    return;
  }

  if (!apiKey.startsWith("gsk_")) {
    obApiKeyInput.classList.add("error");
    showToast("Gecerli bir Groq API Key girin (gsk_ ile baslamali)");
    return;
  }

  goToStep(2);
}

// Groq link
const obGroqLink = document.getElementById("obGroqLink");
if (obGroqLink) {
  obGroqLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.voiceflow.openExternal("https://console.groq.com/keys");
  });
}

// Language selection - Step 2
const langGrid = document.getElementById("obLangGrid");
if (langGrid) {
  langGrid.addEventListener("click", (e) => {
    const langEl = e.target.closest(".ob-lang");
    if (!langEl) return;

    document.querySelectorAll(".ob-lang").forEach(el => el.classList.remove("selected"));
    langEl.classList.add("selected");
    selectedLang = langEl.dataset.lang;
  });
}

// Mic test - Step 3
const obMicBtn = document.getElementById("obMicBtn");
if (obMicBtn) {
  obMicBtn.addEventListener("click", () => {
    if (obMicBtn.classList.contains("listening")) {
      stopMicTest();
      obMicBtn.classList.remove("listening");
      obMicBtn.classList.add("success");
      document.getElementById("obMicStatus").textContent = "Mikrofon calisiyor!";
      document.getElementById("obMicStatus").className = "ob-mic-status ok";
    } else if (!obMicBtn.classList.contains("success")) {
      startMicTest();
    }
  });
}

async function startMicTest() {
  try {
    micTestStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(micTestStream);
    micTestAnalyser = audioCtx.createAnalyser();
    micTestAnalyser.fftSize = 256;
    source.connect(micTestAnalyser);

    const micBtn = document.getElementById("obMicBtn");
    micBtn.classList.add("listening");
    document.getElementById("obMicStatus").textContent = "Konusmaya baslayin... (durdurmak icin tiklayin)";
    document.getElementById("obMicStatus").className = "ob-mic-status";

    const dataArray = new Uint8Array(micTestAnalyser.frequencyBinCount);
    const levelBar = document.getElementById("obLevelBar");

    function updateLevel() {
      if (!micTestAnalyser) return;
      micTestAnalyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const pct = Math.min(100, (avg / 128) * 100);
      levelBar.style.width = pct + "%";
      micTestAnimFrame = requestAnimationFrame(updateLevel);
    }
    updateLevel();
  } catch (err) {
    console.error("Mic test error:", err);
    document.getElementById("obMicStatus").textContent = "Mikrofon erisimi reddedildi!";
    document.getElementById("obMicStatus").className = "ob-mic-status err";
  }
}

function stopMicTest() {
  if (micTestStream) {
    micTestStream.getTracks().forEach(t => t.stop());
    micTestStream = null;
  }
  if (micTestAnimFrame) {
    cancelAnimationFrame(micTestAnimFrame);
    micTestAnimFrame = null;
  }
  micTestAnalyser = null;
}

// Confetti effect
function createConfetti() {
  const wrap = document.getElementById("confettiWrap");
  if (!wrap) return;
  wrap.innerHTML = "";

  const colors = ["#2DD4BF", "#0F766E", "#4F46E5", "#22C55E", "#F59E0B", "#EC4899"];

  for (let i = 0; i < 40; i++) {
    const conf = document.createElement("div");
    conf.className = "confetti";
    conf.style.left = Math.random() * 100 + "%";
    conf.style.top = -10 + "px";
    conf.style.background = colors[Math.floor(Math.random() * colors.length)];
    conf.style.animationDelay = Math.random() * 0.8 + "s";
    conf.style.animationDuration = (1.5 + Math.random() * 1.5) + "s";
    conf.style.width = (4 + Math.random() * 6) + "px";
    conf.style.height = (4 + Math.random() * 6) + "px";
    wrap.appendChild(conf);
  }
}

// Finish onboarding
async function finishOnboarding() {
  cachedSettings = await window.voiceflow.saveSettings({
    language: selectedLang,
    apiKey: EMBEDDED_API_KEY,
    autoPaste: false,
    autoCopy: true,
    removeFiller: true,
    autoPunctuation: true,
    autoCapitalize: true,
    showPill: true,
    setupComplete: true,
  });

  showView("idle");
  window.voiceflow.resizeWindow(380, 100);
  showToast("Hazir! Ctrl+Space ile dikte et");
}

// ==================== SETTINGS BUTTON ====================
document.getElementById("settingsBtn").addEventListener("click", () => {
  window.voiceflow.openSettings();
});

// ==================== RECORDING ====================
document.getElementById("stopBtn").addEventListener("click", () => stopRecording());
document.getElementById("micBtn").addEventListener("click", () => startRecording());
document.getElementById("newRecBtn").addEventListener("click", () => startRecording());
document.getElementById("closeBtn").addEventListener("click", () => {
  window.voiceflow.hideWindow();
});

// Listen for Ctrl+Space from main process
window.voiceflow.onToggleRecording(() => {
  if (isProcessing) return;
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

async function startRecording() {
  if (!cachedSettings) {
    cachedSettings = await window.voiceflow.getSettings();
  }

  if (!cachedSettings.setupComplete) {
    showView("onboarding");
    window.voiceflow.resizeWindow(420, 560);
    return;
  }

  // Check word limit for free users
  if (!cachedSettings.isPro) {
    const today = new Date().toISOString().split("T")[0];
    let count = cachedSettings.dailyWordCount || 0;
    if (cachedSettings.lastWordCountDate !== today) count = 0;
    if (count >= 2000) {
      showUpgradeModal(count);
      return;
    }
  }

  // Play start sound — "bleep"
  playStartSound();

  try {
    const constraints = { audio: true };

    // Use selected audio device if configured
    if (cachedSettings.audioDevice && cachedSettings.audioDevice !== "default") {
      constraints.audio = { deviceId: { exact: cachedSettings.audioDevice } };
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Determine best supported audio format
    let mimeType;
    if (cachedSettings.audioFormat === "wav") {
      mimeType = "audio/wav";
    } else {
      // Try formats in order of preference — webm/opus may not work on Windows
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "",  // empty = browser default
      ];
      mimeType = candidates.find(m => m === "" || MediaRecorder.isTypeSupported(m)) || "";
      if (mimeType === "") {
        console.warn("No preferred mimeType supported, using browser default");
      } else {
        console.log("Using audio format:", mimeType);
      }
    }

    const recorderOptions = mimeType ? { mimeType } : {};
    mediaRecorder = new MediaRecorder(stream, recorderOptions);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blobType = mediaRecorder.mimeType || mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunks, { type: blobType });

      // Check if we actually captured audio
      if (audioBlob.size < 1000) {
        console.warn("Audio blob too small:", audioBlob.size, "bytes");
        showToast("Ses kaydedilemedi — mikrofonu kontrol edin");
        isProcessing = false;
        showView("idle");
        window.voiceflow.resizeWindow(380, 100);
        return;
      }

      console.log("Audio blob size:", audioBlob.size, "type:", blobType);
      await transcribe(audioBlob);
    };

    mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder error:", e.error);
      showToast("Kayit hatasi: " + (e.error?.message || "bilinmeyen hata"));
      isRecording = false;
      isProcessing = false;
      showView("idle");
      window.voiceflow.resizeWindow(380, 100);
    };

    mediaRecorder.start(250);
    isRecording = true;
    seconds = 0;
    timerEl.textContent = "0:00";
    window.voiceflow.setRecordingState(true);
    showView("recording");
    window.voiceflow.resizeWindow(380, 90);
    startTimer();
  } catch (err) {
    console.error("Mic error:", err);
    showView("idle");
    window.voiceflow.resizeWindow(380, 100);
    showToast("Mikrofon erisimi yok!");
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    isProcessing = true;
    window.voiceflow.setRecordingState(false);
    stopTimer();
    showView("processing");
    window.voiceflow.resizeWindow(380, 80);
  }
}

// ==================== TRANSCRIBE ====================
async function transcribe(audioBlob) {
  if (!cachedSettings) {
    cachedSettings = await window.voiceflow.getSettings();
  }
  const apiKey = EMBEDDED_API_KEY;
  const language = cachedSettings.language || "tr";
  const model = cachedSettings.aiModel || "whisper-large-v3-turbo";
  const temperature = cachedSettings.temperature !== undefined ? cachedSettings.temperature : 0;

  try {
    // Determine file extension from actual blob type
    const blobMime = audioBlob.type || "audio/webm";
    let ext = "webm";
    if (blobMime.includes("wav")) ext = "wav";
    else if (blobMime.includes("ogg")) ext = "ogg";
    else if (blobMime.includes("mp4") || blobMime.includes("m4a")) ext = "m4a";
    const file = new File([audioBlob], "recording." + ext, { type: blobMime });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", model);
    formData.append("language", language);
    formData.append("response_format", "verbose_json");
    formData.append("temperature", String(temperature));

    const prompt = LANGUAGE_PROMPTS[language] || "";
    if (prompt) formData.append("prompt", prompt);

    let response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    // Fallback to whisper-large-v3 if turbo fails (not auth error)
    if (!response.ok && response.status !== 401) {
      console.warn("Turbo model failed, trying whisper-large-v3...");
      const fallbackForm = new FormData();
      fallbackForm.append("file", new File([audioBlob], "recording." + ext, { type: blobMime }));
      fallbackForm.append("model", "whisper-large-v3");
      fallbackForm.append("language", language);
      fallbackForm.append("response_format", "verbose_json");
      fallbackForm.append("temperature", String(temperature));
      if (prompt) fallbackForm.append("prompt", prompt);

      response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fallbackForm,
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq error:", errText);

      if (response.status === 401) {
        showToast("API Key gecersiz! Ayarlardan kontrol edin.");
      } else if (response.status === 400) {
        showToast("Ses formati desteklenmiyor — Ayarlardan WAV formatini deneyin");
      } else if (response.status === 413) {
        showToast("Kayit cok uzun — daha kisa konusun");
      } else {
        showToast("Transkripsiyon hatasi: " + response.status);
      }

      isProcessing = false;
      showView("idle");
      window.voiceflow.resizeWindow(380, 100);
      return;
    }

    const result = await response.json();
    const rawText = result.text || "";
    const cleaned = cleanTranscript(rawText, language);

    if (!cleaned) {
      showToast("Ses algilanamadi");
      isProcessing = false;
      showView("idle");
      window.voiceflow.resizeWindow(380, 100);
      return;
    }

    // Play complete sound — "ding"
    playCompleteSound();

    isProcessing = false;

    // Copy to clipboard immediately
    if (cachedSettings.autoCopy !== false) {
      window.voiceflow.copyToClipboard(cleaned);
    }

    // Show result with typing animation
    await showResultWithTyping(cleaned);

    // Update result badge
    window.voiceflow.showResult(cleaned);

    // Save to transcript history
    await saveToHistory(cleaned);

    // Update word count
    await updateDailyWordCount(cleaned);

    // Auto-paste: hide window and simulate Ctrl+V (premium only)
    if (cachedSettings.autoPaste && isPremiumAvailable(cachedSettings)) {
      setTimeout(() => {
        showToast("Kopyalandi!");
        setTimeout(() => {
          window.voiceflow.autoPaste();
        }, 600);
      }, 800);
    }

  } catch (err) {
    console.error("Transcription error:", err);
    showToast("Baglanti hatasi!");
    isProcessing = false;
    showView("idle");
    window.voiceflow.resizeWindow(380, 100);
  }
}

// ==================== HISTORY ====================
async function saveToHistory(text) {
  try {
    const settings = await window.voiceflow.getSettings();
    const history = settings.transcriptHistory || [];

    // Add new entry at the beginning
    history.unshift({
      text: text,
      time: new Date().toISOString(),
      lang: settings.language || "tr",
    });

    // Keep only last 50 entries
    if (history.length > 50) {
      history.length = 50;
    }

    await window.voiceflow.saveSettings({ transcriptHistory: history });
  } catch (e) {
    console.error("History save error:", e);
  }
}

// ==================== WORD COUNT ====================
async function updateDailyWordCount(text) {
  try {
    const settings = await window.voiceflow.getSettings();
    const today = new Date().toISOString().split("T")[0];
    let count = settings.dailyWordCount || 0;

    // Reset if new day
    if (settings.lastWordCountDate !== today) {
      count = 0;
    }

    // Count words in the transcribed text
    const words = text.trim().split(/\s+/).length;
    count += words;

    await window.voiceflow.saveSettings({
      dailyWordCount: count,
      lastWordCountDate: today,
    });

    // Check limit for free users (2000 words/day)
    if (!settings.isPro && count >= 2000) {
      showUpgradeModal(count);
    }
  } catch (e) {
    console.error("Word count error:", e);
  }
}

// ==================== HELPERS ====================
function cleanTranscript(text, language) {
  if (!text) return "";
  let cleaned = text;

  // Remove filler words if enabled
  if (cachedSettings.removeFiller !== false) {
    const patterns = FILLER_PATTERNS[language] || FILLER_PATTERNS.en || [];
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, "");
    }
  }

  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // Auto capitalize if enabled
  if (cachedSettings.autoCapitalize !== false && cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Auto punctuation if enabled
  if (cachedSettings.autoPunctuation !== false && cleaned && !/[.!?]$/.test(cleaned)) {
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

    // Auto-stop if max recording time is set
    const maxTime = cachedSettings.maxRecTime || 120;
    if (maxTime > 0 && seconds >= maxTime) {
      stopRecording();
    }
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
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ==================== UPGRADE MODAL ====================
const VOICEFLOW_PRICING_URL = "https://voiceflow.app/#pricing";

const upgradeModal = document.getElementById("upgradeModal");
const upgradeBtn = document.getElementById("upgradeBtn");
const upgradeCloseBtn = document.getElementById("upgradeCloseBtn");

function showUpgradeModal(wordCount, trialExpired) {
  // Resize window to fit modal
  window.voiceflow.resizeWindow(380, 420);

  // Update word count display
  const wcEl = document.getElementById("upgradeWordCount");
  const msgEl = document.getElementById("upgradeMessage");
  if (trialExpired) {
    if (wcEl) wcEl.textContent = "";
    if (msgEl) msgEl.textContent = "Deneme sureniz doldu. Pro'ya yukselterek sinirsiz kullanmaya devam edin.";
  } else {
    if (wcEl) wcEl.textContent = wordCount ? wordCount.toLocaleString("tr-TR") : "2.000";
    if (msgEl) msgEl.textContent = "Gunluk 2.000 kelime limitine ulastiniz.";
  }

  upgradeModal.classList.remove("hidden");
}

function hideUpgradeModal() {
  upgradeModal.classList.add("hidden");
  // Restore window to idle size
  showView("idle");
  window.voiceflow.resizeWindow(380, 100);
}

if (upgradeBtn) {
  upgradeBtn.addEventListener("click", () => {
    window.voiceflow.openExternal(VOICEFLOW_PRICING_URL);
    hideUpgradeModal();
  });
}

if (upgradeCloseBtn) {
  upgradeCloseBtn.addEventListener("click", () => {
    hideUpgradeModal();
  });
}

// ==================== START ====================
init();
