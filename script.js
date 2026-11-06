// Mila Website: Google Privacy & Messaging (CMP)
// Die Einwilligungsnachricht wird von Google AdSense Privacy & Messaging bereitgestellt.
// Der Footer-Link öffnet Googles Widerrufs-/Einstellungsdialog.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-google-consent-settings]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      window.googlefc = window.googlefc || {};
      window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
      window.googlefc.callbackQueue.push({
        CONSENT_API_READY: () => {
          if (typeof window.googlefc.showRevocationMessage === "function") {
            window.googlefc.showRevocationMessage();
          }
        }
      });
    });
  });
});
