// Mila Website: Consent-Management für Google Analytics 4
// Google Analytics wird erst nach ausdrücklicher Zustimmung geladen.
const GA_MEASUREMENT_ID = "G-M2E0X0Y1QK";
const CONSENT_KEY = "mila_cookie_consent_v2";

function readConsent() {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); }
  catch { return null; }
}

function updateGoogleConsent(granted) {
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }
}

function loadAnalytics() {
  if (window.milaAnalyticsLoaded) {
    updateGoogleConsent(true);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  window.gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(tag);
  window.milaAnalyticsLoaded = true;
}

function clearAnalyticsCookies() {
  // Entfernt bekannte GA-Cookies auf der aktuellen Domain beim Widerruf.
  const names = document.cookie.split(";").map(item => item.trim().split("=")[0]);
  names.filter(name => /^(_ga|_gid|_gat)/.test(name)).forEach(name => {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}; SameSite=Lax`;
  });
}

function closeCookieSettings() {
  const dialog = document.getElementById("cookie-settings");
  if (dialog) dialog.hidden = true;
}

function saveConsent(analytics) {
  const choice = { necessary: true, analytics: !!analytics, savedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));

  if (choice.analytics) {
    loadAnalytics();
  } else {
    updateGoogleConsent(false);
    clearAnalyticsCookies();
  }

  closeCookieSettings();
  const banner = document.getElementById("cookie-banner");
  if (banner) banner.hidden = true;
}

function openCookieSettings() {
  const dialog = document.getElementById("cookie-settings");
  if (!dialog) return;
  const stored = readConsent();
  const checkbox = document.getElementById("analytics-consent");
  if (checkbox) checkbox.checked = !!(stored && stored.analytics);
  dialog.hidden = false;
  const close = document.getElementById("cookie-close");
  if (close) close.focus();
}

function createCookieUI() {
  const banner = document.createElement("section");
  banner.id = "cookie-banner";
  banner.className = "cookie-banner";
  banner.setAttribute("aria-label", "Cookie-Auswahl");
  banner.setAttribute("aria-live", "polite");
  banner.innerHTML = `
    <div class="cookie-copy">
      <span class="cookie-eyebrow">DEINE ENTSCHEIDUNG</span>
      <strong>Ein kleines bisschen Statistik? ♡</strong>
      <p>Notwendige Funktionen halten diese Website am Laufen. Wenn du möchtest, hilft uns Google Analytics zu verstehen, welche Seiten und Themen besucht werden. Du entscheidest ganz in Ruhe.</p>
      <a href="datenschutz.html">Mehr dazu im Datenschutz</a>
    </div>
    <div class="cookie-actions" aria-label="Cookie-Auswahl">
      <button type="button" class="cookie-button secondary" id="cookie-reject">Nur notwendige</button>
      <button type="button" class="cookie-button secondary" id="cookie-settings-open">Einstellungen</button>
      <button type="button" class="cookie-button primary" id="cookie-accept">Alle akzeptieren</button>
    </div>`;
  document.body.appendChild(banner);

  const dialog = document.createElement("div");
  dialog.id = "cookie-settings";
  dialog.className = "cookie-overlay";
  dialog.hidden = true;
  dialog.innerHTML = `
    <div class="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-description">
      <button type="button" class="cookie-close" id="cookie-close" aria-label="Einstellungen schließen">×</button>
      <span class="cookie-eyebrow">MILA · PRIVATSPHÄRE</span>
      <h2 id="cookie-title">Deine Cookie-Auswahl</h2>
      <p id="cookie-description">Du kannst selbst entscheiden, ob du uns mit anonymisierten Nutzungsstatistiken helfen möchtest. Deine Auswahl kannst du jederzeit über „Cookie-Einstellungen“ im Footer ändern.</p>
      <div class="cookie-option">
        <div><strong>Notwendige Funktionen</strong><small>Speichern deiner Cookie-Auswahl und grundlegende Funktionen der Website.</small></div>
        <span class="always-on">Immer aktiv</span>
      </div>
      <label class="cookie-option" for="analytics-consent">
        <div><strong>Statistik · Google Analytics</strong><small>Erfasst nach deiner Zustimmung Seitenaufrufe und Interaktionen, damit wir verstehen, welche Inhalte interessant sind.</small></div>
        <input id="analytics-consent" type="checkbox">
      </label>
      <div class="cookie-actions dialog-actions">
        <button type="button" class="cookie-button secondary" id="cookie-save-reject">Nur notwendige</button>
        <button type="button" class="cookie-button primary" id="cookie-save">Auswahl speichern</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);

  document.getElementById("cookie-reject").addEventListener("click", () => saveConsent(false));
  document.getElementById("cookie-accept").addEventListener("click", () => saveConsent(true));
  document.getElementById("cookie-settings-open").addEventListener("click", openCookieSettings);
  document.getElementById("cookie-close").addEventListener("click", closeCookieSettings);
  document.getElementById("cookie-save-reject").addEventListener("click", () => saveConsent(false));
  document.getElementById("cookie-save").addEventListener("click", () => {
    saveConsent(document.getElementById("analytics-consent").checked);
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeCookieSettings();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !dialog.hidden) closeCookieSettings();
  });
}

function initCookieConsent() {
  // Oberfläche auf jeder Seite erzeugen, damit Cookie-Einstellungen
  // auch nach einer gespeicherten Auswahl über den Footer erreichbar bleiben.
  createCookieUI();

  const stored = readConsent();
  const banner = document.getElementById("cookie-banner");

  if (stored) {
    if (banner) banner.hidden = true;
    if (stored.analytics) {
      loadAnalytics();
    } else {
      updateGoogleConsent(false);
    }
  } else {
    if (banner) banner.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCookieConsent();
  document.querySelectorAll("[data-cookie-settings]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      openCookieSettings();
    });
  });
});
