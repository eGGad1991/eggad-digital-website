(function () {
  "use strict";

  const STORAGE_KEY = "mila_cookie_preferences_v1";
  const GA_ID = "G-M2E0X0Y1QK";

  function readPreferences() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function savePreferences(preferences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      necessary: true,
      analytics: !!preferences.analytics,
      savedAt: new Date().toISOString()
    }));
  }

  function loadAnalytics() {
    if (window.__milaGaLoaded) return;
    window.__milaGaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

    // Basic Consent Mode: GA is loaded only after the visitor opts in.
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted"
    });
    window.gtag("consent", "update", {
      analytics_storage: "granted"
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(script);
  }

  function denyAnalyticsAndClearCookies() {
    if (window.gtag) {
      window.gtag("consent", "update", { analytics_storage: "denied" });
    }
    document.cookie.split(";").forEach(function (cookie) {
      const name = cookie.split("=")[0].trim();
      if (/^(_ga|_gid|_gat)/.test(name)) {
        document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax";
        document.cookie = name + "=; Max-Age=0; path=/; domain=" + location.hostname + "; SameSite=Lax";
      }
    });
  }

  function addStyles() {
    if (document.getElementById("mila-cookie-styles")) return;
    const style = document.createElement("style");
    style.id = "mila-cookie-styles";
    style.textContent = `
      #mila-cookie-banner, #mila-cookie-settings { font-family: Arial, sans-serif; }
      #mila-cookie-banner[hidden], #mila-cookie-settings[hidden] { display:none !important; }
      #mila-cookie-banner { position:fixed; z-index:99999; left:18px; right:18px; bottom:18px; max-width:1050px; margin:auto; padding:22px; color:#f8f5fa; background:#211c30; border:1px solid #bd8bff88; border-radius:16px; box-shadow:0 18px 60px #000b; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:20px; align-items:center; }
      #mila-cookie-banner h2 { margin:0 0 8px; font-size:21px; color:#fff; }
      #mila-cookie-banner p { margin:0; color:#ddd5e4; font-size:13px; line-height:1.55; }
      #mila-cookie-banner a, #mila-cookie-settings a { color:#edb8e4; text-decoration:underline; }
      .mila-cookie-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
      .mila-cookie-btn { border:1px solid #ad91c4; border-radius:9px; padding:11px 14px; min-height:42px; background:transparent; color:#fff; cursor:pointer; font-weight:700; font-size:13px; }
      .mila-cookie-btn.primary { background:linear-gradient(120deg,#d6a6ff,#edadd5); color:#24162d; border-color:transparent; }
      .mila-cookie-btn:focus-visible, #mila-cookie-banner a:focus-visible, #mila-cookie-settings a:focus-visible { outline:3px solid #edb8e4; outline-offset:3px; }
      #mila-cookie-settings { position:fixed; z-index:100000; inset:0; background:#080610d9; display:grid; place-items:center; padding:18px; }
      #mila-cookie-settings .panel { width:min(100%,540px); padding:26px; background:#211c30; color:#f8f5fa; border:1px solid #bd8bff88; border-radius:16px; box-shadow:0 20px 70px #000b; }
      #mila-cookie-settings h2 { margin:0 0 10px; color:#fff; }
      #mila-cookie-settings p { font-size:13px; line-height:1.6; color:#ddd5e4; }
      #mila-cookie-settings label { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 0; border-top:1px solid #ffffff25; }
      #mila-cookie-settings input { width:20px; height:20px; accent-color:#bd8bff; }
      #mila-cookie-settings .small { font-size:11px; color:#c8bdcf; }
      .mila-cookie-footer-link { cursor:pointer; background:none; border:0; color:inherit; text-decoration:underline; font:inherit; padding:0; }
      @media(max-width:760px) {
        #mila-cookie-banner { left:10px; right:10px; bottom:10px; padding:17px; display:block; }
        #mila-cookie-banner h2 { font-size:19px; }
        .mila-cookie-actions { display:grid; grid-template-columns:1fr 1fr; margin-top:14px; }
        .mila-cookie-btn.primary { grid-column:1/-1; }
        #mila-cookie-settings .panel { padding:22px 18px; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildUI() {
    addStyles();

    const banner = document.createElement("section");
    banner.id = "mila-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "mila-cookie-title");
    banner.hidden = true;
    banner.innerHTML = `
      <div>
        <h2 id="mila-cookie-title">Deine Privatsphäre ist uns wichtig</h2>
        <p>Wir verwenden notwendige Technologien für den Betrieb dieser Website. Mit deiner Zustimmung nutzen wir zusätzlich Google Analytics, um die Nutzung der Website statistisch auszuwerten. Du kannst deine Auswahl jederzeit ändern. Weitere Informationen findest du in unserer <a href="/datenschutz/">Datenschutzerklärung</a>.</p>
      </div>
      <div class="mila-cookie-actions">
        <button type="button" class="mila-cookie-btn primary" id="mila-cookie-accept">Alle akzeptieren</button>
        <button type="button" class="mila-cookie-btn" id="mila-cookie-reject">Nur notwendige</button>
        <button type="button" class="mila-cookie-btn" id="mila-cookie-customize">Einstellungen</button>
      </div>`;
    document.body.appendChild(banner);

    const settings = document.createElement("div");
    settings.id = "mila-cookie-settings";
    settings.hidden = true;
    settings.innerHTML = `
      <div class="panel" role="dialog" aria-modal="true" aria-labelledby="mila-cookie-settings-title">
        <h2 id="mila-cookie-settings-title">Cookie-Einstellungen</h2>
        <p>Du kannst deine Einwilligung für optionale Statistik jederzeit ändern. Notwendige Technologien sind für den Betrieb der Website erforderlich.</p>
        <label><span><strong>Notwendige Technologien</strong><br><span class="small">Immer aktiv, damit die Website funktioniert.</span></span><input type="checkbox" checked disabled></label>
        <label><span><strong>Statistik (Google Analytics)</strong><br><span class="small">Hilft uns zu verstehen, wie die Website genutzt wird.</span></span><input type="checkbox" id="mila-cookie-analytics"></label>
        <p><strong>Werbung:</strong> Google AdSense ist vorerst deaktiviert. Für personalisierte Anzeigen im EWR ist eine von Google zertifizierte, TCF-integrierte CMP erforderlich. Dieses eigene Banner ersetzt diese CMP nicht.</p>
        <p><a href="/datenschutz/">Datenschutzerklärung öffnen</a></p>
        <div class="mila-cookie-actions">
          <button type="button" class="mila-cookie-btn primary" id="mila-cookie-save">Auswahl speichern</button>
          <button type="button" class="mila-cookie-btn" id="mila-cookie-close">Schließen</button>
        </div>
      </div>`;
    document.body.appendChild(settings);

    const footerLinks = document.querySelectorAll("footer .footerlinks");
    footerLinks.forEach(function (container) {
      if (!container.querySelector('[data-mila-cookie-open]')) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mila-cookie-footer-link";
        button.textContent = "Cookie-Einstellungen";
        button.setAttribute("data-mila-cookie-open", "true");
        container.appendChild(button);
      }
    });

    const analyticsToggle = settings.querySelector("#mila-cookie-analytics");
    function openSettings() {
      const current = readPreferences();
      analyticsToggle.checked = !!(current && current.analytics);
      settings.hidden = false;
    }
    function closeSettings() { settings.hidden = true; }
    function applyChoice(analytics) {
      savePreferences({ analytics: analytics });
      if (analytics) loadAnalytics();
      else denyAnalyticsAndClearCookies();
      banner.hidden = true;
      closeSettings();
    }

    banner.querySelector("#mila-cookie-accept").addEventListener("click", function () { applyChoice(true); });
    banner.querySelector("#mila-cookie-reject").addEventListener("click", function () { applyChoice(false); });
    banner.querySelector("#mila-cookie-customize").addEventListener("click", openSettings);
    settings.querySelector("#mila-cookie-save").addEventListener("click", function () { applyChoice(analyticsToggle.checked); });
    settings.querySelector("#mila-cookie-close").addEventListener("click", closeSettings);
    settings.addEventListener("click", function (event) { if (event.target === settings) closeSettings(); });
    document.querySelectorAll("[data-mila-cookie-open]").forEach(function (button) {
      button.addEventListener("click", openSettings);
    });

    const preferences = readPreferences();
    if (!preferences) {
      banner.hidden = false;
    } else if (preferences.analytics) {
      loadAnalytics();
    } else {
      denyAnalyticsAndClearCookies();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();