// Elements
const apiKeyInput = document.getElementById("apiKeyInput");
const toggleApiKeyBtn = document.getElementById("toggleApiKey");
const langSelect = document.getElementById("langSelect");
const autoPasteCheckbox = document.getElementById("autoPasteCheckbox");
const resetBtn = document.getElementById("resetBtn");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

let apiKeyVisible = false;

// Load saved settings
chrome.storage.local.get(["apiKey", "language", "autoPaste"], (data) => {
  if (data.apiKey) apiKeyInput.value = data.apiKey;
  if (data.language) langSelect.value = data.language;
  autoPasteCheckbox.checked = data.autoPaste !== false; // default true
});

// Auto-save API key on blur
apiKeyInput.addEventListener("blur", () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    chrome.storage.local.set({ apiKey: key });
    showToast("API Key kaydedildi!");
  }
});

// Also save on Enter
apiKeyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    apiKeyInput.blur();
  }
});

// Toggle API key visibility
toggleApiKeyBtn.addEventListener("click", () => {
  apiKeyVisible = !apiKeyVisible;
  apiKeyInput.type = apiKeyVisible ? "text" : "password";
});

// Save language on change
langSelect.addEventListener("change", () => {
  chrome.storage.local.set({ language: langSelect.value });
  showToast("Dil kaydedildi!");
});

// Save auto-paste on change
autoPasteCheckbox.addEventListener("change", () => {
  chrome.storage.local.set({ autoPaste: autoPasteCheckbox.checked });
  showToast(autoPasteCheckbox.checked ? "Otomatik yapıştırma açık" : "Otomatik yapıştırma kapalı");
});

// Reset all settings
resetBtn.addEventListener("click", () => {
  if (confirm("Tüm ayarlar sıfırlanacak. Emin misiniz?")) {
    chrome.storage.local.clear(() => {
      apiKeyInput.value = "";
      langSelect.value = "tr";
      autoPasteCheckbox.checked = true;
      showToast("Ayarlar sıfırlandı!");
    });
  }
});

function showToast(message) {
  toastText.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}
