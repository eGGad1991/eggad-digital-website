(() => {
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
  let selectedFiles = [];
  let client;

  function message(el, text, type="") { el.textContent = text; el.className = "message " + type; }
  function setupError() {
    loginPanel.hidden = false;
    loginForm.hidden = true;
    message(loginMessage, "Die Supabase-Konfiguration fehlt noch. Bitte zuerst den öffentlichen Publishable-/Anon-Key in supabase-config.js eintragen.", "error");
  }
  if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.anonKey.startsWith("HIER_")) { setupError(); return; }
  client = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

  function showSession(session) {
    loginPanel.hidden = !!session;
    uploaderPanel.hidden = !session;
    if (session) message(loginMessage, "");
  }
  client.auth.getSession().then(({data}) => showSession(data.session));
  client.auth.onAuthStateChange((_event, session) => showSession(session));

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    message(loginMessage, "Anmeldung läuft …");
    const {error} = await client.auth.signInWithPassword({
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    });
    message(loginMessage, error ? error.message : "Erfolgreich angemeldet.", error ? "error" : "success");
  });

  document.getElementById("logout").addEventListener("click", async () => {
    await client.auth.signOut();
    showSession(null);
    selectedFiles = [];
    preview.innerHTML = "";
    fileInput.value = "";
  });

  fileInput.addEventListener("change", () => {
    selectedFiles = Array.from(fileInput.files || []);
    preview.innerHTML = "";
    let valid = true;
    selectedFiles.forEach(file => {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size > 50 * 1024 * 1024) valid = false;
      const img = document.createElement("img");
      img.alt = file.name;
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);
    });
    uploadButton.disabled = !selectedFiles.length || !valid;
    message(uploadMessage, valid ? `${selectedFiles.length} Bild(er) ausgewählt.` : "Bitte nur JPG, PNG, WebP oder GIF bis 50 MB auswählen.", valid ? "" : "error");
  });

  uploadButton.addEventListener("click", async () => {
    if (!selectedFiles.length) return;
    uploadButton.disabled = true;
    const category = document.getElementById("category").value;
    let success = 0;
    for (const file of selectedFiles) {
      const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
      const path = `${category}/${Date.now()}-${crypto.randomUUID()}-${safeName || "bild"}`;
      message(uploadMessage, `Lade hoch (${success + 1}/${selectedFiles.length}): ${file.name}`);
      const {error} = await client.storage.from(cfg.bucket || "portfolio-media").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type
      });
      if (error) {
        message(uploadMessage, `Fehler bei ${file.name}: ${error.message}`, "error");
        uploadButton.disabled = false;
        return;
      }
      success++;
    }
    selectedFiles = [];
    preview.innerHTML = "";
    fileInput.value = "";
    message(uploadMessage, `${success} Bild(er) erfolgreich hochgeladen. Sie erscheinen nach dem Neuladen in der Galerie.`, "success");
    uploadButton.disabled = true;
  });
})();