(() => {
  'use strict';

  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const bucket = cfg.privateBucket || 'mila-private-vault';
  const allowedTypes = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/gif', 'gif']
  ]);
  const maxFileSize = 50 * 1024 * 1024;

  const el = (id) => document.getElementById(id);
  const checking = el('checking');
  const loginPanel = el('login-panel');
  const vaultPanel = el('vault-panel');
  const loginForm = el('login-form');
  const loginButton = el('login-button');
  const loginMessage = el('login-message');
  const filesInput = el('files');
  const preview = el('preview');
  const uploadButton = el('upload-button');
  const uploadMessage = el('upload-message');
  const archiveGrid = el('archive-grid');
  const archiveMessage = el('archive-message');

  let client;
  let selectedFiles = [];
  let selectedPreviewUrls = [];
  let archiveObjectUrls = [];
  let verifiedToken = null;
  let deniedAccess = false;

  function setMessage(node, value, type = '') {
    node.textContent = value;
    node.className = `message ${type}`.trim();
  }

  function show(view) {
    checking.hidden = view !== 'checking';
    loginPanel.hidden = view !== 'login';
    vaultPanel.hidden = view !== 'vault';
  }

  function clearObjectUrls(urls) {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls.length = 0;
  }

  function clearArchive() {
    clearObjectUrls(archiveObjectUrls);
    archiveGrid.replaceChildren();
  }

  function clearSelection() {
    selectedFiles = [];
    clearObjectUrls(selectedPreviewUrls);
    preview.replaceChildren();
    filesInput.value = '';
    uploadButton.disabled = true;
  }

  if (!window.supabase || !cfg.url || !cfg.anonKey) {
    show('login');
    loginForm.hidden = true;
    setMessage(loginMessage, 'Die Anmeldung ist derzeit nicht verfügbar. Bitte später erneut versuchen.', 'error');
    return;
  }

  client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  async function loadArchive() {
    clearArchive();
    setMessage(archiveMessage, 'Gespeicherte Dateien werden geladen …');

    const { data: items, error } = await client.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) {
      setMessage(archiveMessage, `Archiv konnte nicht geladen werden: ${error.message}`, 'error');
      return;
    }

    const images = (items || []).filter((item) => item && item.id && item.name);
    if (!images.length) {
      setMessage(archiveMessage, 'Noch keine Dateien gespeichert.');
      return;
    }

    setMessage(archiveMessage, `${images.length} Datei(en) im privaten Archiv.`);
    for (const item of images) {
      const card = document.createElement('article');
      card.className = 'archive-card';
      const image = document.createElement('img');
      image.alt = 'Privat gespeichertes Bild';
      image.loading = 'lazy';
      image.decoding = 'async';
      const date = document.createElement('p');
      date.className = 'file-date';
      const parsedDate = item.created_at ? new Date(item.created_at) : null;
      date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleString('de-DE')
        : 'Gespeicherte Datei';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Datei löschen';
      remove.addEventListener('click', () => deleteFile(item.name, remove));
      card.append(image, date, remove);
      archiveGrid.append(card);

      const { data: blob, error: downloadError } = await client.storage.from(bucket).download(item.name);
      if (downloadError) {
        image.alt = 'Bild konnte nicht geladen werden';
        image.removeAttribute('src');
        continue;
      }
      const objectUrl = URL.createObjectURL(blob);
      archiveObjectUrls.push(objectUrl);
      image.src = objectUrl;
    }
  }

  async function deleteFile(name, button) {
    if (!window.confirm('Dieses Bild dauerhaft aus dem privaten Archiv löschen?')) return;
    button.disabled = true;
    const { error } = await client.storage.from(bucket).remove([name]);
    if (error) {
      setMessage(archiveMessage, `Löschen fehlgeschlagen: ${error.message}`, 'error');
      button.disabled = false;
      return;
    }
    await loadArchive();
  }

  async function authorize(session) {
    if (!session) {
      verifiedToken = null;
      clearSelection();
      clearArchive();
      show('login');
      setMessage(loginMessage, deniedAccess
        ? 'Dieses Konto hat keine Freigabe für den privaten Bereich.'
        : 'Bitte mit dem freigeschalteten Administratorkonto anmelden.', deniedAccess ? 'error' : '');
      deniedAccess = false;
      return;
    }

    if (session.access_token === verifiedToken) return;
    verifiedToken = session.access_token;
    show('checking');

    const { data: isAdmin, error } = await client.rpc('is_portfolio_admin');
    if (error || isAdmin !== true) {
      deniedAccess = true;
      verifiedToken = null;
      await client.auth.signOut();
      show('login');
      setMessage(loginMessage, 'Kein Zugriff. Dieses Konto ist nicht als Administrator freigeschaltet.', 'error');
      return;
    }

    deniedAccess = false;
    show('vault');
    await loadArchive();
  }

  client.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => { authorize(session); }, 0);
  });

  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      show('login');
      setMessage(loginMessage, `Sitzung konnte nicht geprüft werden: ${error.message}`, 'error');
      return;
    }
    authorize(data.session);
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginButton.disabled = true;
    loginButton.textContent = 'Anmeldung läuft …';
    setMessage(loginMessage, 'Zugang wird geprüft …');

    const { data, error } = await client.auth.signInWithPassword({
      email: el('email').value.trim(),
      password: el('password').value
    });

    if (error) {
      setMessage(loginMessage, 'Anmeldung fehlgeschlagen. Bitte E-Mail-Adresse und Passwort prüfen.', 'error');
    } else {
      await authorize(data.session);
    }
    loginButton.disabled = false;
    loginButton.textContent = 'Anmelden';
  });

  el('logout-button').addEventListener('click', async () => {
    await client.auth.signOut();
    verifiedToken = null;
    clearSelection();
    clearArchive();
    show('login');
    setMessage(loginMessage, 'Du wurdest abgemeldet.');
  });

  filesInput.addEventListener('change', () => {
    clearObjectUrls(selectedPreviewUrls);
    preview.replaceChildren();
    selectedFiles = Array.from(filesInput.files || []);
    const invalid = selectedFiles.find((file) => !allowedTypes.has(file.type) || file.size > maxFileSize);
    if (invalid) {
      selectedFiles = [];
      filesInput.value = '';
      uploadButton.disabled = true;
      setMessage(uploadMessage, 'Bitte nur JPG, PNG, WebP oder GIF bis 50 MB je Datei auswählen.', 'error');
      return;
    }

    selectedFiles.forEach((file) => {
      const image = document.createElement('img');
      image.alt = 'Ausgewähltes Bild';
      const url = URL.createObjectURL(file);
      selectedPreviewUrls.push(url);
      image.src = url;
      preview.append(image);
    });

    uploadButton.disabled = selectedFiles.length === 0;
    setMessage(uploadMessage, selectedFiles.length
      ? `${selectedFiles.length} Bild(er) ausgewählt.`
      : 'Noch keine Bilder ausgewählt.');
  });

  uploadButton.addEventListener('click', async () => {
    if (!selectedFiles.length || uploadButton.disabled) return;
    uploadButton.disabled = true;
    let uploaded = 0;

    for (const file of selectedFiles) {
      const extension = allowedTypes.get(file.type);
      const privateName = `${crypto.randomUUID()}.${extension}`;
      setMessage(uploadMessage, `Privater Upload ${uploaded + 1}/${selectedFiles.length} …`);
      const { error } = await client.storage.from(bucket).upload(privateName, file, {
        cacheControl: '60',
        upsert: false,
        contentType: file.type
      });

      if (error) {
        setMessage(uploadMessage, `Upload fehlgeschlagen: ${error.message}`, 'error');
        uploadButton.disabled = false;
        return;
      }
      uploaded += 1;
    }

    clearSelection();
    setMessage(uploadMessage, `${uploaded} Bild(er) wurden ausschließlich im privaten Archiv gespeichert.`, 'success');
    await loadArchive();
  });

  el('refresh-button').addEventListener('click', loadArchive);
})();
