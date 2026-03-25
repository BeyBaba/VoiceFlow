// GhostX Screen Protection - Screenshot Engelleme + Uyari Sistemi
// Screenshot alinirsa: SIYAH EKRAN yakalanir + TUM KULLANICILARA UYARI gider
// Electron'da OS seviyesinde koruma, Web'de en iyi caba

type ScreenshotAlertCallback = () => void;

let alertCallback: ScreenshotAlertCallback | null = null;
let isProtectionActive = false;
let blackOverlay: HTMLDivElement | null = null;

/**
 * Screenshot uyari callback'ini ayarla
 * Bu callback, screenshot denemesi algilandiginda cagirilir
 * PeerManager.sendScreenshotAlert() ile tum peer'lere bildirim gonderir
 */
export function setScreenshotAlertCallback(callback: ScreenshotAlertCallback): void {
  alertCallback = callback;
}

/**
 * Ekran korumayi baslat
 */
export function enableScreenProtection(): void {
  if (isProtectionActive) return;
  isProtectionActive = true;

  // 1. CSS korumalari
  applyCSSProtection();

  // 2. Klavye kisayollarini dinle (PrintScreen, Win+Shift+S, Cmd+Shift+3/4)
  window.addEventListener('keydown', handleScreenshotKeydown, true);
  window.addEventListener('keyup', handleScreenshotKeyup, true);

  // 3. Visibility change (sekme degisimi)
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 4. Print engelleme
  window.addEventListener('beforeprint', handleBeforePrint);
  window.addEventListener('afterprint', handleAfterPrint);

  // 5. Context menu engelleme (sag tik -> kaydet)
  document.addEventListener('contextmenu', handleContextMenu);

  // 6. Electron tarafinda OS seviyesinde koruma
  enableElectronProtection();
}

/**
 * Ekran korumayi durdur
 */
export function disableScreenProtection(): void {
  isProtectionActive = false;

  window.removeEventListener('keydown', handleScreenshotKeydown, true);
  window.removeEventListener('keyup', handleScreenshotKeyup, true);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('beforeprint', handleBeforePrint);
  window.removeEventListener('afterprint', handleAfterPrint);
  document.removeEventListener('contextmenu', handleContextMenu);

  removeCSSProtection();
  removeBlackOverlay();
}

// === CSS Korumalari ===

function applyCSSProtection(): void {
  const style = document.createElement('style');
  style.id = 'ghostx-screen-protection';
  style.textContent = `
    .ghostx-root {
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }

    /* Print engellemesi */
    @media print {
      .ghostx-root {
        display: none !important;
      }
      body::after {
        content: "GhostX - Icerik korunmaktadir";
        display: block;
        text-align: center;
        padding: 100px;
        font-size: 24px;
        color: #666;
      }
    }
  `;
  document.head.appendChild(style);
}

function removeCSSProtection(): void {
  const style = document.getElementById('ghostx-screen-protection');
  if (style) style.remove();
}

// === Screenshot Klavye Algilama ===

function handleScreenshotKeydown(e: KeyboardEvent): void {
  // PrintScreen
  if (e.key === 'PrintScreen') {
    e.preventDefault();
    triggerScreenshotAlert();
    return;
  }

  // Win+Shift+S (Windows Snipping Tool)
  if (e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
    // Engelleyemeyiz ama uyari gonderebiliriz
    triggerScreenshotAlert();
    return;
  }

  // Cmd+Shift+3 veya Cmd+Shift+4 (macOS screenshot)
  if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) {
    triggerScreenshotAlert();
    return;
  }

  // Cmd+Shift+5 (macOS screen recording)
  if (e.metaKey && e.shiftKey && e.key === '5') {
    triggerScreenshotAlert();
    return;
  }
}

function handleScreenshotKeyup(e: KeyboardEvent): void {
  if (e.key === 'PrintScreen') {
    // PrintScreen birakildiktan sonra overlay'i kaldir
    setTimeout(removeBlackOverlay, 500);
  }
}

// === Screenshot Uyari Tetikleme ===

function triggerScreenshotAlert(): void {
  // 1. Ekrani siyaha boyaScreenshot
  showBlackOverlay();

  // 2. Tum peer'lere uyari gonder
  if (alertCallback) {
    alertCallback();
  }

  // 3. 500ms sonra overlay'i kaldir
  setTimeout(removeBlackOverlay, 500);
}

// === Siyah Overlay ===

function showBlackOverlay(): void {
  if (blackOverlay) return;

  blackOverlay = document.createElement('div');
  blackOverlay.id = 'ghostx-black-overlay';
  blackOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #000000;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    font-size: 14px;
  `;
  blackOverlay.textContent = '';
  document.body.appendChild(blackOverlay);
}

function removeBlackOverlay(): void {
  if (blackOverlay) {
    blackOverlay.remove();
    blackOverlay = null;
  }
}

// === Visibility Change (Sekme Degisimi) ===

function handleVisibilityChange(): void {
  if (document.hidden) {
    // Sekme gizlendi - icerik zaten gorunmuyor
    // Ama geri donuste gosterim icin not dusebiliriz
  }
}

// === Print Engelleme ===

function handleBeforePrint(): void {
  showBlackOverlay();
  triggerScreenshotAlert();
}

function handleAfterPrint(): void {
  removeBlackOverlay();
}

// === Context Menu ===

function handleContextMenu(e: Event): void {
  // GhostX iceriginde sag tiklemeyi engelle
  const target = e.target as HTMLElement;
  if (target.closest('.ghostx-root')) {
    e.preventDefault();
  }
}

// === Electron Koruma ===

function enableElectronProtection(): void {
  // Electron ortaminda mi?
  if (typeof window !== 'undefined' && 'ghostx' in window) {
    try {
      // OS seviyesinde screenshot engelleme
      // setContentProtection(true) -> screenshot'ta SIYAH EKRAN
      (window as Record<string, unknown>).ghostx &&
        ((window as Record<string, { enableScreenProtection: () => void }>).ghostx).enableScreenProtection();
    } catch {
      // Electron degil veya API yok
    }
  }
}

// === Ekran Kayit Programi Tespiti (Electron) ===

/**
 * Aktif ekran kayit programlarini tara
 * OBS, Bandicam, ShareX vb. tespit edilirse uyari verir
 * Sadece Electron ortaminda calisir
 */
export async function detectScreenRecorders(): Promise<string[]> {
  // Bu fonksiyon Electron main process'ten cagirilir
  // Web ortaminda bos dizi dondurur
  if (typeof window === 'undefined' || !('ghostx' in window)) {
    return [];
  }

  // Bilinen ekran kayit programlari
  const knownRecorders = [
    'obs', 'obs64', 'obs-studio',
    'bandicam', 'bdcam',
    'sharex',
    'camtasia', 'camrec',
    'screencast',
    'fraps',
    'action',
    'xsplit',
    'streamlabs',
  ];

  // Not: Gercek implementasyon Electron main process'te
  // process.list() veya tasklist komutuyla yapilir
  return knownRecorders.filter(() => false); // Placeholder
}
