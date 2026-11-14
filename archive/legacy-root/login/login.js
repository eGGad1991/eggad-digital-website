(() => {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const form = document.getElementById('login-form');
  const button = document.getElementById('login-button');
  const messageEl = document.getElementById('message');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');

  function showMessage(text, type = '') {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
  }

  if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.anonKey.startsWith('HIER_')) {
    form.hidden = true;
    showMessage('Die Anmeldung ist noch nicht korrekt konfiguriert. Bitte den Website-Administrator informieren.', 'error');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  client.auth.getSession().then(({ data, error }) => {
    if (error) showMessage('Sitzung konnte nicht geprüft werden: ' + error.message, 'error');
    else if (data.session) window.location.replace('/upload/');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    button.textContent = 'Anmeldung läuft …';
    showMessage('Bitte einen Moment …');
    const { error } = await client.auth.signInWithPassword({
      email: emailEl.value.trim(),
      password: passwordEl.value
    });
    if (error) {
      showMessage('Anmeldung fehlgeschlagen. Bitte E-Mail-Adresse und Passwort prüfen.', 'error');
      button.disabled = false;
      button.textContent = 'Erneut versuchen';
      passwordEl.focus();
      return;
    }
    showMessage('Angemeldet. Der Bilder-Upload wird geöffnet …', 'success');
    window.location.replace('/upload/');
  });
})();
