(() => {
  'use strict';
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/upload/sw.js").catch(() => {}));

  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const loginPanel = document.getElementById("login");
  const uploaderPanel = document.getElementById("uploader");
  const destinationPanel = document.getElementById("destination-panel");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const uploadMessage = document.getElementById("upload-message");
  const fileInput = document.getElementById("files");
  const preview = document.getElementById("preview");
  const uploadButton = document.getElementById("upload-button");
  const destinationChoices = Array.from(document.querySelectorAll('input[name="upload-destination"]'));
  const destination = {
    get value() {
      return document.querySelector('input[name="upload-destination"]:checked')?.value || "public";
    }
  };
  const destinationNote = document.getElementById("destination-note");
  const blogOptions = document.getElementById("blog-options");
  const blogPostSelect = document.getElementById("blog-post-select");
  const blogImageKind = document.getElementById("blog-image-kind");
  const blogAltText = document.getElementById("blog-alt-text");
  const fileSelectionHint = document.getElementById("file-selection-hint");
  const blogNote = document.getElementById("blog-note");
  const logoutButton = document.getElementById("logout");

  const bolognesePostSlug = "einfache-bolognese-rezept";
  const bologneseAltTexts = {
    cover: "Mila steht in ihrer Küche mit einer Tomate in der Hand. Vor ihr liegen Hackfleisch, Karotten, Knoblauch, passierte Tomaten, Tomatenmark und Kräuter für ihre einfache Bolognese.",
    inline: [
      "Mila brät krümeliges Hackfleisch in einem großen Topf an. Daneben stehen vorbereitete Karottenwürfel, gehackter Knoblauch und passierte Tomaten.",
      "Mila probiert die köchelnde Bolognese aus Hackfleisch, Karotten und Tomaten. Die Soße simmert im Topf und ist mit Kräutern gewürzt.",
      "Mila serviert die fertige Bolognese mit Spaghetti, Parmesan und frischem Basilikum auf einem Teller."
    ]
  };

  async function updateSuggestedBlogAltText() {
    const post = blogPosts.find((item) => item.id === blogPostSelect.value);
    if (!post) {
      blogAltText.value = "";
      return;
    }

    if (post.slug !== bolognesePostSlug) {
      blogAltText.value = "";
      blogNote.textContent = "Für diesen Beitrag bitte einen passenden Alt-Text zum ausgewählten Bild eintragen.";
      return;
    }

    if (blogImageKind.value === "cover") {
      blogAltText.value = bologneseAltTexts.cover;
      blogNote.textContent = "Alt-Text für das Bolognese-Titelbild wurde automatisch eingesetzt. Du kannst ihn bei Bedarf bearbeiten.";
      return;
    }

    const { data, error } = await client.from("blog_post_images")
      .select("id")
      .eq("post_id", post.id)
      .eq("image_kind", "inline");

    if (error) {
      blogNote.textContent = "Der nächste Bildschritt konnte nicht erkannt werden. Bitte Alt-Text vor dem Upload prüfen.";
      blogAltText.value = "";
      return;
    }

    const index = (data || []).length;
    if (index < bologneseAltTexts.inline.length) {
      blogAltText.value = bologneseAltTexts.inline[index];
      blogNote.textContent = "Alt-Text für Rezeptbild " + (index + 2) + " von 4 wurde automatisch eingesetzt. Bitte die Bilder in der vorgesehenen Reihenfolge hochladen.";
    } else {
      blogAltText.value = "";
      blogNote.textContent = "Die vier vorgesehenen Rezeptbilder sind bereits zugeordnet. Für weitere Bilder bitte einen eigenen Alt-Text eintragen.";
    }
  }

  const maxFileSize = 50 * 1024 * 1024;
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  let selectedFiles = [];
  let selectedPreviewUrls = [];
  let client;
  let verifiedToken = null;
  let blogPosts = [];
  let blogPostsLoaded = false;

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
    // Storage destination choices are admin-only and stay hidden until admin verification succeeds.
    destinationPanel.hidden = true;
    loginPanel.hidden = false;
    uploaderPanel.hidden = true;
    message(loginMessage, text, type);
  }
  function showUploader() {
    loginPanel.hidden = true;
    uploaderPanel.hidden = false;
    destinationPanel.hidden = false;
    message(loginMessage, "");
  }
  function updateDestinationNote() {
    const target = destination.value;
    const isBlog = target === "blog";
    blogOptions.hidden = !isBlog;
    fileInput.multiple = !isBlog;
    fileSelectionHint.textContent = isBlog
      ? "Ein Bild pro Upload · JPG, PNG, WebP, GIF · max. 50 MB"
      : "Mehrere Bilder möglich · JPG, PNG, WebP, GIF · max. 50 MB pro Bild";

    if (isBlog) {
      destinationNote.textContent = "Blog: Nach der Admin-Anmeldung kannst du einen Beitrag, den Bildtyp und einen passenden Alt-Text auswählen. Das Bild wird im Speicher „mila-blog-media“ abgelegt und direkt mit dem Beitrag verknüpft.";
      uploadButton.textContent = "Bild dem Blogbeitrag hinzufügen";
      if (selectedFiles.length > 1) {
        clearSelection();
        message(uploadMessage, "Für Blogbilder bitte jeweils ein Bild auswählen, damit jeder Alt-Text einzeln gespeichert wird.", "error");
      }
      if (!blogPostsLoaded) loadBlogPosts().catch((error) => {
        blogNote.textContent = `Blogbeiträge konnten nicht geladen werden: ${error.message || "Bitte erneut anmelden."}`;
      });
    } else if (target === "private") {
      destinationNote.textContent = "Privates Archiv: Upload in den geschützten Supabase-Speicher „mila-private-vault“. Die Bilder sind nur nach Admin-Anmeldung unter /mila-k7/ sichtbar.";
      uploadButton.textContent = "Bilder privat speichern";
    } else {
      destinationNote.textContent = "Öffentliche Galerie: Upload in den öffentlichen Supabase-Speicher „portfolio-media/galerie“. Die Bilder erscheinen anschließend auf /galerie/ und sind für alle Besucher sichtbar.";
      uploadButton.textContent = "Bilder in die öffentliche Galerie hochladen";
    }
  }

  async function loadBlogPosts() {
    if (blogPostsLoaded) return;
    blogPostSelect.disabled = true;
    blogPostSelect.replaceChildren(new Option("Blogbeiträge werden geladen …", ""));
    const { data, error } = await client.from("blog_posts")
      .select("id,title,slug,category,media_folder,status,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    blogPosts = data || [];
    blogPostSelect.replaceChildren(new Option(
      blogPosts.length ? "Bitte Blogbeitrag auswählen" : "Noch keine Blogbeiträge vorhanden",
      ""
    ));
    blogPosts.forEach((post) => {
      const status = post.status === "published" ? "veröffentlicht" : "Entwurf";
      blogPostSelect.add(new Option(`${post.title} · ${status}`, post.id));
    });
    const recipePosts = blogPosts.filter((post) => post.category === "Rezepte");
    if (recipePosts.length === 1) blogPostSelect.value = recipePosts[0].id;
    else if (blogPosts.length === 1) blogPostSelect.value = blogPosts[0].id;
    blogPostSelect.disabled = blogPosts.length === 0;
    blogPostsLoaded = true;
    blogNote.textContent = blogPosts.length
      ? "Blogbilder werden im Bucket „mila-blog-media“ im Medienordner des Beitrags gespeichert. Für Milas Bolognese werden die passenden Alt-Texte automatisch eingesetzt."
      : "Es gibt noch keine gespeicherten Blogbeiträge. Lege zuerst in der Blogverwaltung einen Entwurf an.";
    await updateSuggestedBlogAltText();
  }

  function slugifyFilename(value) {
    return String(value || "bild").toLowerCase().trim()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "bild";
  }

  async function optimizeBlogImage(file) {
    if (!file || file.type === "image/gif" || !("createImageBitmap" in window)) return file;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const maxEdge = 1800;
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d", { alpha: true });
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
      if (!blob || blob.size >= file.size) return file;
      const base = file.name.replace(/\.[^.]+$/, "") || "bild";
      return new File([blob], `${base}.webp`, { type: "image/webp", lastModified: Date.now() });
    } catch (error) {
      console.warn("Blogbild-Optimierung übersprungen:", error);
      return file;
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
    loadBlogPosts().catch((loadError) => {
      blogNote.textContent = `Blogbeiträge konnten nicht geladen werden: ${loadError.message || "Bitte erneut versuchen."}`;
    });
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

  destinationChoices.forEach((choice) => choice.addEventListener("change", updateDestinationNote));
  blogPostSelect.addEventListener("change", () => {
    updateSuggestedBlogAltText().catch((error) => console.warn("Alt-Text konnte nicht vorgeschlagen werden:", error));
  });
  blogImageKind.addEventListener("change", () => {
    updateSuggestedBlogAltText().catch((error) => console.warn("Alt-Text konnte nicht vorgeschlagen werden:", error));
  });
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
    if (!["public", "private", "blog"].includes(target)) {
      message(uploadMessage, "Bitte zuerst einen gültigen Speicherort auswählen.", "error");
      uploadButton.disabled = false;
      return;
    }

    if (target === "blog") {
      const post = blogPosts.find((item) => item.id === blogPostSelect.value);
      const kind = blogImageKind.value;
      const altText = blogAltText.value.trim();
      if (!post) {
        message(uploadMessage, "Bitte zuerst einen Blogbeitrag auswählen.", "error");
        uploadButton.disabled = false;
        return;
      }
      if (!["cover", "inline"].includes(kind)) {
        message(uploadMessage, "Bitte einen gültigen Bildtyp auswählen.", "error");
        uploadButton.disabled = false;
        return;
      }
      if (selectedFiles.length !== 1) {
        message(uploadMessage, "Für Blogbilder bitte genau ein Bild pro Upload auswählen.", "error");
        uploadButton.disabled = false;
        return;
      }
      if (!altText) {
        message(uploadMessage, "Bitte einen passenden Alt-Text für das Bild eintragen.", "error");
        uploadButton.disabled = false;
        blogAltText.focus();
        return;
      }
      const originalFile = selectedFiles[0];
      const file = await optimizeBlogImage(originalFile);
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const baseName = slugifyFilename(file.name.replace(/\.[^.]+$/, ""));
      const mediaFolder = post.media_folder || `blog-posts/${post.slug}`;
      const folder = kind === "cover" ? "cover" : "inline";
      const storagePath = `${mediaFolder}/${folder}/${Date.now()}-${baseName}.${extension}`;
      const bucket = cfg.blogBucket || "mila-blog-media";
      message(uploadMessage, `Lade Blogbild für „${post.title}“ hoch …`);
      const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, file, {
        contentType: file.type, upsert: false, cacheControl: "31536000"
      });
      if (uploadError) {
        message(uploadMessage, `Blog-Upload fehlgeschlagen: ${uploadError.message}`, "error");
        uploadButton.disabled = false;
        return;
      }

      const { data: publicData } = client.storage.from(bucket).getPublicUrl(storagePath);
      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) {
        await client.storage.from(bucket).remove([storagePath]);
        message(uploadMessage, "Die öffentliche Bildadresse konnte nicht erstellt werden.", "error");
        uploadButton.disabled = false;
        return;
      }

      const { data: imageRow, error: rowError } = await client.from("blog_post_images").insert({
        post_id: post.id,
        storage_path: storagePath,
        public_url: publicUrl,
        alt_text: altText,
        image_kind: kind
      }).select("id").single();
      if (rowError) {
        await client.storage.from(bucket).remove([storagePath]);
        message(uploadMessage, `Bilddatei wurde hochgeladen, aber nicht dem Beitrag zugeordnet: ${rowError.message}`, "error");
        uploadButton.disabled = false;
        return;
      }

      if (kind === "cover") {
        const { error: coverError } = await client.from("blog_posts")
          .update({ cover_image: publicUrl }).eq("id", post.id);
        if (coverError) {
          await client.from("blog_post_images").delete().eq("id", imageRow.id);
          await client.storage.from(bucket).remove([storagePath]);
          message(uploadMessage, `Das Titelbild konnte nicht im Beitrag gesetzt werden: ${coverError.message}`, "error");
          uploadButton.disabled = false;
          return;
        }
      }

      clearSelection();
      if (kind === "cover") blogImageKind.value = "inline";
      await updateSuggestedBlogAltText();
      message(uploadMessage, kind === "cover"
        ? `Titelbild wurde „${post.title}“ zugeordnet und gespeichert.`
        : `Bild wurde „${post.title}“ als Beitragsbild zugeordnet. Es erscheint im Bereich „Weitere Bilder“ des Artikels.`, "success");
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
