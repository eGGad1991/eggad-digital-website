// Mila Website: einfache Einwilligungssteuerung für Google Analytics 4
// Analytics wird erst geladen, wenn Besucher ausdrücklich zustimmen.
const GA_MEASUREMENT_ID = "G-M2E0X0Y1QK";
const CONSENT_KEY = "mila_cookie_consent_v1";

document.querySelectorAll('nav a').forEach(a => {
  if (a.href === location.href) a.classList.add('active');
});

function loadAnalytics() {
  if (window.milaAnalyticsLoaded) return;
  window.milaAnalyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(tag);
}

function saveConsent(analytics) {
  const value = { analytics: !!analytics, savedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  closeCookieSettings();
  const banner = document.getElementById('cookie-banner');
  if (banner) banner.hidden = true;
  if (value.analytics) loadAnalytics();
}

function closeCookieSettings() {
  const dialog = document.getElementById('cookie-settings');
  if (dialog) dialog.hidden = true;
}

function openCookieSettings() {
  const dialog = document.getElementById('cookie-settings');
  if (!dialog) return;
  const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
  const checkbox = document.getElementById('analytics-consent');
  if (checkbox) checkbox.checked = !!(stored && stored.analytics);
  dialog.hidden = false;
}

function initCookieConsent() {
  const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
  if (stored && stored.analytics) loadAnalytics();
  if (stored) return;

  const banner = document.createElement('section');
  banner.id = 'cookie-banner';
  banner.className = 'cookie-banner';
  banner.setAttribute('aria-label', 'Cookie-Einstellungen');
  banner.innerHTML = `
    <div class="cookie-copy">
      <strong>Deine Privatsphäre ist wichtig</strong>
      <p>Wir verwenden notwendige Speicherfunktionen für die Website. Mit deiner Zustimmung nutzen wir Google Analytics, um zu verstehen, wie die Website besucht und genutzt wird. Du kannst ablehnen oder deine Auswahl später ändern.</p>
      <a href="datenschutz.html">Mehr in der Datenschutzerklärung</a>
    </div>
    <div class="cookie-actions">
      <button type="button" class="cookie-button secondary" id="cookie-reject">Ablehnen</button>
      <button type="button" class="cookie-button secondary" id="cookie-settings-open">Einstellungen</button>
      <button type="button" class="cookie-button primary" id="cookie-accept">Alle akzeptieren</button>
    </div>`;
  document.body.appendChild(banner);

  const dialog = document.createElement('div');
  dialog.id = 'cookie-settings';
  dialog.className = 'cookie-overlay';
  dialog.hidden = true;
  dialog.innerHTML = `
    <div class="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <button type="button" class="cookie-close" id="cookie-close" aria-label="Schließen">×</button>
      <span class="eyebrow">DATENSCHUTZ</span>
      <h2 id="cookie-title">Cookie-Einstellungen</h2>
      <p>Notwendige Funktionen sind immer aktiv. Du entscheidest, ob Google Analytics zur Reichweitenmessung verwendet werden darf.</p>
      <div class="cookie-option"><div><strong>Notwendig</strong><small>Für Grundfunktionen und das Speichern deiner Auswahl.</small></div><span class="always-on">Immer aktiv</span></div>
      <label class="cookie-option" for="analytics-consent"><div><strong>Statistik (Google Analytics)</strong><small>Hilft uns zu erkennen, welche Seiten besucht werden und über welche Quellen Besucher kommen.</small></div><input id="analytics-consent" type="checkbox"></label>
      <div class="cookie-actions dialog-actions">
        <button type="button" class="cookie-button secondary" id="cookie-save-reject">Nur notwendige</button>
        <button type="button" class="cookie-button primary" id="cookie-save">Auswahl speichern</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);

  document.getElementById('cookie-reject').addEventListener('click', () => saveConsent(false));
  document.getElementById('cookie-accept').addEventListener('click', () => saveConsent(true));
  document.getElementById('cookie-settings-open').addEventListener('click', openCookieSettings);
  document.getElementById('cookie-close').addEventListener('click', closeCookieSettings);
  document.getElementById('cookie-save-reject').addEventListener('click', () => saveConsent(false));
  document.getElementById('cookie-save').addEventListener('click', () => {
    saveConsent(document.getElementById('analytics-consent').checked);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCookieConsent();
  document.querySelectorAll('[data-cookie-settings]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      openCookieSettings();
    });
  });
});
