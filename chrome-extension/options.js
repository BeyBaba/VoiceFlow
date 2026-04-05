// Elements
const langSelect = document.getElementById("langSelect");
const autoPasteCheckbox = document.getElementById("autoPasteCheckbox");
const resetBtn = document.getElementById("resetBtn");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

// Load saved settings
chrome.storage.local.get(["language", "autoPaste"], (data) => {
  if (data.language) langSelect.value = data.language;
  autoPasteCheckbox.checked = data.autoPaste !== false; // default true
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
