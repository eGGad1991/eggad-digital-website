(() => {
  'use strict';
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const bucket = cfg.privateBucket || 'mila-private-vault';
  const el = (id) => document.getElementById(id);
  const checking = el('checking');
  const loginPanel = el('login-panel');
  const vaultPanel = el('vault-panel');
  const loginForm = el('login-form');
  const loginButton = el('login-button');
  const loginMessage = el('login-message');
  const archiveGrid = el('archive-grid');
  const archiveMessage = el('archive-message');
  let client;
  let verifiedToken = null;
  let objectUrls = [];

  function setMessage(node, value, type = '') {
    node.textContent = value;
    node.className = `message ${type}`.trim();
  }
  function show(view) {
    checking.hidden = view !== 'checking';
    loginPanel.hidden = view !== 'login';
    vaultPanel.hidden = view !== 'vault';
  }
  function clearArchive() {
    objectUrls.forEach(URL.revokeObjectURL);
    objectUrls = [];
    archiveGrid.replaceChildren();
  }

  if (!window.supabase || !cfg.url || !cfg.anonKey) {
    show('login');
    loginForm.hidden = true;
    setMessage(loginMessage, 'Die Anmeldung ist derzeit nicht verfügbar.', 'error');
    return;
  }
  client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  async function loadArchive() {
    clearArchive();
    setMessage(archiveMessage, 'Private Bilder werden geladen …');
    const { data: items, error } = await client.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    if (error) {
      setMessage(archiveMessage, `Archiv konnte nicht geladen werden: ${error.message}`, 'error');
      return;
    }
    const images = (items || []).filter(item => item && item.id && item.name && !item.name.startsWith('.'));
    if (!images.length) {
      setMessage(archiveMessage, 'Im privaten Archiv sind noch keine Bilder gespeichert. Du kannst Bilder über „Bilder hochladen“ mit dem Speicherort „Privates Archiv“ hinzufügen.');
      return;
    }
    setMessage(archiveMessage, `${images.length} private Datei(en).`);
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
      date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleString('de-DE') : 'Privat gespeichert';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Datei löschen';
      remove.addEventListener('click', () => deleteFile(item.name, remove));
      card.append(image, date, remove);
      archiveGrid.append(card);
      const { data: blob, error: downloadError } = await client.storage.from(bucket).download(item.name);
      if (downloadError) {
        image.alt = 'Privates Bild konnte nicht geladen werden';
        continue;
      }
      const url = URL.createObjectURL(blob);
      objectUrls.push(url);
      image.src = url;
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
      clearArchive();
      show('login');
      setMessage(loginMessage, 'Bitte melde dich mit dem freigeschalteten Administratorkonto an.');
      return;
    }
    if (session.access_token === verifiedToken) return;
    verifiedToken = session.access_token;
    show('checking');
    const { data: isAdmin, error } = await client.rpc('is_portfolio_admin');
    if (error || isAdmin !== true) {
      verifiedToken = null;
      await client.auth.signOut();
      show('login');
      setMessage(loginMessage, 'Kein Zugriff. Dieses Konto ist nicht als Administrator freigeschaltet.', 'error');
      return;
    }
    show('vault');
    await loadArchive();
  }

  client.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => { authorize(session); }, 0);
  });
  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      show('login');
      setMessage(loginMessage, 'Sitzung konnte nicht geprüft werden. Bitte neu anmelden.', 'error');
    } else authorize(data.session);
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
    if (error) setMessage(loginMessage, 'Anmeldung fehlgeschlagen. Bitte E-Mail-Adresse und Passwort prüfen.', 'error');
    else await authorize(data.session);
    loginButton.disabled = false;
    loginButton.textContent = 'Anmelden';
  });

  el('logout-button').addEventListener('click', async () => {
    await client.auth.signOut();
    verifiedToken = null;
    clearArchive();
    show('login');
    setMessage(loginMessage, 'Du wurdest abgemeldet.');
  });
  el('refresh-button').addEventListener('click', loadArchive);
})();
