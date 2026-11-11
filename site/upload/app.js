(() => {
  'use strict';
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/upload/sw.js").catch(() => {}));

  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const loginPanel = document.getElementById("login");
  const uploaderPanel = document.getElementById("uploader");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const uploadMessage = document.getElementById("upload-message");
  const fileInput = document.getElementById("files");
  const preview = document.getElementById("preview");
  const uploadButton = document.getElementById("upload-button");
  const destination = document.getElementById("destination");
  const destinationNote = document.getElementById("destination-note");
  const logoutButton = document.getElementById("logout");
  const maxFileSize = 50 * 1024 * 1024;
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  let selectedFiles = [];
  let selectedPreviewUrls = [];
  let client;
  let verifiedToken = null;

  function message(el, text, type = "") {
    el.textContent = text;
    el.className = "message " + type;
  }
  function clearSelection() {
    selectedPreviewUrls.forEach(URL.revokeObjectURL);
    selectedPreviewUrls = [];
    selectedFiles = [];
    preview.replaceChildren();
    fileInput.value = "";
    uploadButton.disabled = true;
  }
  function showLogin(text = "Bitte mit dem freigeschalteten Administratorkonto anmelden.", type = "") {
    loginPanel.hidden = false;
    uploaderPanel.hidden = true;
    message(loginMessage, text, type);
  }
  function showUploader() {
    loginPanel.hidden = true;
    uploaderPanel.hidden = false;
    message(loginMessage, "");
  }
  function updateDestinationNote() {
    if (destination.value === "private") {
      destinationNote.textContent = "Privates Archiv: Upload in den geschützten Supabase-Speicher „mila-private-vault“. Die Bilder sind nur nach Admin-Anmeldung unter /mila-k7/ sichtbar.";
      uploadButton.textContent = "Bilder privat speichern";
    } else {
      destinationNote.textContent = "Öffentliche Galerie: Upload in den öffentlichen Supabase-Speicher „portfolio-media/galerie“. Die Bilder erscheinen anschließend auf /galerie/ und sind für alle Besucher sichtbar.";
      uploadButton.textContent = "Bilder in die öffentliche Galerie hochladen";
    }
  }

  if (!window.supabase || !cfg.url || !cfg.anonKey) {
    showLogin("Die Supabase-Verbindung ist derzeit nicht verfügbar. Bitte später erneut versuchen.", "error");
    loginForm.hidden = true;
    return;
  }
  client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  async function authorize(session) {
    if (!session) {
      verifiedToken = null;
      clearSelection();
      showLogin();
      return;
    }
    if (session.access_token === verifiedToken) return;
    verifiedToken = session.access_token;
    showLogin("Administrator-Zugriff wird geprüft …");
    const { data: isAdmin, error } = await client.rpc("is_portfolio_admin");
    if (error || isAdmin !== true) {
      verifiedToken = null;
      await client.auth.signOut();
      showLogin("Kein Zugriff. Dieses Konto ist nicht als Administrator freigeschaltet.", "error");
      return;
    }
    showUploader();
  }

  client.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => { authorize(session); }, 0);
  });
  client.auth.getSession().then(({ data, error }) => {
    if (error) showLogin("Sitzung konnte nicht geprüft werden. Bitte neu anmelden.", "error");
    else authorize(data.session);
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector("button[type=submit]");
    button.disabled = true;
    message(loginMessage, "Anmeldung läuft …");
    const { data, error } = await client.auth.signInWithPassword({
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    });
    if (error) message(loginMessage, "Anmeldung fehlgeschlagen. Bitte E-Mail-Adresse und Passwort prüfen.", "error");
    else await authorize(data.session);
    button.disabled = false;
  });

  logoutButton.addEventListener("click", async () => {
    await client.auth.signOut();
    verifiedToken = null;
    clearSelection();
    showLogin("Du wurdest abgemeldet.");
  });

  destination.addEventListener("change", updateDestinationNote);
  updateDestinationNote();

  fileInput.addEventListener("change", () => {
    const incomingFiles = Array.from(fileInput.files || []);
    clearSelection();
    selectedFiles = incomingFiles;
    const invalid = selectedFiles.find(file => !allowedTypes.has(file.type) || file.size > maxFileSize);
    if (invalid) {
      clearSelection();
      message(uploadMessage, "Bitte nur JPG, PNG, WebP oder GIF bis 50 MB je Bild auswählen.", "error");
      return;
    }
    selectedFiles.forEach(file => {
      const img = document.createElement("img");
      img.alt = "Ausgewähltes Bild";
      const url = URL.createObjectURL(file);
      selectedPreviewUrls.push(url);
      img.src = url;
      preview.appendChild(img);
    });
    uploadButton.disabled = selectedFiles.length === 0;
    message(uploadMessage, selectedFiles.length ? `${selectedFiles.length} Bild(er) ausgewählt.` : "Noch keine Bilder ausgewählt.");
  });

  uploadButton.addEventListener("click", async () => {
    if (!selectedFiles.length || uploadButton.disabled) return;
    uploadButton.disabled = true;
    const target = destination.value;
    if (target !== "public" && target !== "private") {
      message(uploadMessage, "Bitte zuerst einen gültigen Speicherort auswählen.", "error");
      uploadButton.disabled = false;
      return;
    }
    const bucket = target === "private" ? (cfg.privateBucket || "mila-private-vault") : (cfg.bucket || "portfolio-media");
    let uploaded = 0;
    message(uploadMessage, target === "private" ? "Ziel: Privates Archiv (nur Admin)." : "Ziel: Öffentliche Galerie (für alle sichtbar).");
    for (const file of selectedFiles) {
      const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-90);
      const path = target === "private"
        ? `${crypto.randomUUID()}.${file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]}`
        : `galerie/${Date.now()}-${crypto.randomUUID()}-${safeName || "bild"}`;
      message(uploadMessage, `Lade hoch (${uploaded + 1}/${selectedFiles.length}): ${file.name}`);
      const { error } = await client.storage.from(bucket).upload(path, file, {
        cacheControl: target === "private" ? "0" : "3600",
        upsert: false,
        contentType: file.type
      });
      if (error) {
        message(uploadMessage, `Upload fehlgeschlagen: ${error.message}`, "error");
        uploadButton.disabled = false;
        return;
      }
      uploaded += 1;
    }
    clearSelection();
    if (target === "private") {
      message(uploadMessage, `${uploaded} Bild(er) wurden privat im Archiv gespeichert. Öffne „Privates Archiv“, um sie anzusehen.`, "success");
    } else {
      message(uploadMessage, `${uploaded} Bild(er) wurden in der öffentlichen Galerie gespeichert. Sie erscheinen unter „Öffentliche Galerie“.`, "success");
    }
  });
})();
