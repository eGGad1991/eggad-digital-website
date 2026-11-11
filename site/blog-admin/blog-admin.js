(() => {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const BUCKET = cfg.blogBucket || 'mila-blog-media';
  const $ = (id) => document.getElementById(id);
  const loginPanel = $('admin-login-panel');
  const adminApp = $('admin-app');
  const loginForm = $('admin-login-form');
  const loginMessage = $('admin-login-message');
  const form = $('post-form');
  const bodyEditor = $('post-body');
  const postList = $('admin-post-list');
  const formMessage = $('post-form-message');
  let client = null;
  let currentPost = null;
  let allPosts = [];
  let editorRange = null;

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function showMessage(element, text, type = '') {
    element.textContent = text;
    element.className = `admin-message ${type}`;
  }

  function slugify(value) {
    return String(value || '').toLowerCase().trim()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  }

  function sanitizeEditorHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html || ''), 'text/html');
    const allowed = new Set(['P','H2','H3','H4','UL','OL','LI','STRONG','B','EM','I','A','BLOCKQUOTE','BR','HR','FIGURE','FIGCAPTION','IMG']);
    const base = `${String(cfg.url || '').replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/`;
    const clean = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        if (!allowed.has(child.tagName)) {
          if (['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','FORM'].includes(child.tagName)) child.remove();
          else { clean(child); child.replaceWith(...child.childNodes); }
          return;
        }
        [...child.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (child.tagName === 'IMG' && name === 'src') {
            try {
              const url = new URL(attr.value, location.origin).href;
              if (url.startsWith(base)) child.setAttribute('src', url); else child.remove();
            } catch (_) { child.remove(); }
          } else if (child.tagName === 'A' && name === 'href') {
            try {
              const url = new URL(attr.value, location.origin);
              if (['http:','https:','mailto:'].includes(url.protocol)) child.setAttribute('href', url.href); else child.removeAttribute('href');
            } catch (_) { child.removeAttribute('href'); }
          } else if ((child.tagName === 'IMG' && ['alt','title'].includes(name)) || (child.tagName === 'A' && ['title','target'].includes(name))) {
            if (name === 'target' && attr.value !== '_blank') child.removeAttribute(name);
          } else child.removeAttribute(name);
        });
        if (child.tagName === 'A' && child.getAttribute('target') === '_blank') child.setAttribute('rel','noopener noreferrer');
        clean(child);
      });
    };
    clean(doc.body);
    return doc.body.innerHTML;
  }

  function preserveEditorSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount) editorRange = selection.getRangeAt(0).cloneRange();
  }

  bodyEditor.addEventListener('keyup', preserveEditorSelection);
  bodyEditor.addEventListener('mouseup', preserveEditorSelection);
  bodyEditor.addEventListener('focus', preserveEditorSelection);

  document.querySelectorAll('.editor-toolbar [data-command]').forEach((button) => {
    button.addEventListener('click', () => {
      bodyEditor.focus();
      const command = button.dataset.command;
      const value = button.dataset.value || null;
      document.execCommand(command, false, value);
      preserveEditorSelection();
    });
  });

  $('add-link-button').addEventListener('click', () => {
    const url = window.prompt('Welche Webadresse soll verlinkt werden?');
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (!['http:','https:','mailto:'].includes(parsed.protocol)) throw new Error('Ungültiges Protokoll');
      bodyEditor.focus();
      document.execCommand('createLink', false, parsed.href);
      preserveEditorSelection();
    } catch (_) { window.alert('Bitte eine gültige Webadresse eingeben.'); }
  });

  $('post-title').addEventListener('input', () => {
    if (!currentPost) $('post-slug').value = slugify($('post-title').value);
  });

  function renderStatus(status) {
    if (status === 'published') return '<span class="status-pill published">Veröffentlicht</span>';
    return '<span class="status-pill">Entwurf</span>';
  }

  function renderPostList() {
    $('admin-post-count').textContent = `${allPosts.length}`;
    postList.replaceChildren();
    if (!allPosts.length) {
      const empty = document.createElement('p');
      empty.className = 'form-hint';
      empty.textContent = 'Noch keine Beiträge vorhanden. Lege deinen ersten Entwurf an.';
      postList.appendChild(empty);
      return;
    }
    allPosts.forEach((post) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `admin-post-item${currentPost?.id === post.id ? ' selected' : ''}`;
      item.innerHTML = `<span class="admin-post-title">${escapeHtml(post.title)}</span>${renderStatus(post.status)}<small>${escapeHtml(post.category || 'KI & Digital')}</small>`;
      item.addEventListener('click', () => loadPostIntoEditor(post));
      postList.appendChild(item);
    });
  }

  async function ensureMediaFolder(post) {
    if (!post?.media_folder) return;
    const storage = client.storage.from(BUCKET);
    const { data: files, error: listError } = await storage.list(post.media_folder, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
    if (listError) console.warn('Medienordner konnte nicht geprüft werden:', listError.message);
    if ((files || []).some((item) => item.name === '.folder.txt')) return;
    const marker = new Blob([`Medienordner für den Blogbeitrag: ${post.title}\nSlug: ${post.slug}\n`], { type: 'text/plain;charset=utf-8' });
    const { error } = await storage.upload(`${post.media_folder}/.folder.txt`, marker, {
      contentType: 'text/plain', upsert: true, cacheControl: '3600'
    });
    if (error) console.warn('Medienordner konnte nicht angelegt werden:', error.message);
  }

  async function loadPosts() {
    const { data, error } = await client.from('blog_posts')
      .select('id,title,slug,excerpt,body,category,cover_image,status,published_at,created_at,media_folder,updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    allPosts = data || [];
    renderPostList();
    for (const post of allPosts) ensureMediaFolder(post).catch((error) => console.warn(error));
  }

  async function loadImages(postId) {
    const list = $('post-media-list');
    list.replaceChildren();
    const { data, error } = await client.from('blog_post_images')
      .select('id,storage_path,public_url,alt_text,image_kind,created_at')
      .eq('post_id', postId).order('created_at', { ascending: true });
    if (error) {
      console.warn('Bildliste konnte nicht geladen werden:', error.message);
      return;
    }
    (data || []).forEach((image) => {
      const row = document.createElement('div');
      row.className = 'media-thumb-row';
      const img = document.createElement('img');
      img.src = image.public_url; img.alt = image.alt_text || 'Blogbild';
      const label = document.createElement('span');
      label.textContent = image.image_kind === 'cover' ? 'Titelbild' : 'Bild im Beitrag';
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button'; deleteBtn.textContent = 'Entfernen';
      deleteBtn.addEventListener('click', () => deleteImage(image));
      row.append(img, label, deleteBtn);
      list.appendChild(row);
    });
  }

  async function deleteImage(image) {
    if (!window.confirm('Dieses Bild wirklich aus dem Blogbeitrag entfernen?')) return;
    const { error: storageError } = await client.storage.from(BUCKET).remove([image.storage_path]);
    if (storageError) { showMessage(formMessage, storageError.message, 'error'); return; }
    const { error } = await client.from('blog_post_images').delete().eq('id', image.id);
    if (error) { showMessage(formMessage, error.message, 'error'); return; }
    if (image.image_kind === 'cover' && currentPost && currentPost.cover_image === image.public_url) {
      await client.from('blog_posts').update({ cover_image: null }).eq('id', currentPost.id);
      currentPost.cover_image = null;
      $('current-cover-preview').hidden = true;
    }
    await loadImages(currentPost.id);
    showMessage(formMessage, 'Bild wurde entfernt.', 'success');
  }

  function setCoverPreview(url) {
    const wrap = $('current-cover-preview');
    wrap.replaceChildren();
    if (!url) { wrap.hidden = true; return; }
    const img = document.createElement('img'); img.src = url; img.alt = 'Aktuelles Titelbild';
    const text = document.createElement('span'); text.textContent = 'Aktuelles Titelbild';
    wrap.append(img, text); wrap.hidden = false;
  }

  function loadPostIntoEditor(post) {
    currentPost = post;
    $('editor-heading').textContent = post.title || 'Beitrag bearbeiten';
    $('editor-status').outerHTML = `<span id="editor-status" class="status-pill">${post.status === 'published' ? 'Veröffentlicht' : 'Entwurf gespeichert'}</span>`;
    $('post-title').value = post.title || '';
    $('post-slug').value = post.slug || '';
    $('post-slug').readOnly = true;
    $('slug-hint').textContent = 'Der Kurzname bleibt nach dem ersten Speichern unverändert, damit Artikeladresse und Bilderordner zusammenpassen.';
    $('post-category').value = post.category || 'KI im Alltag';
    $('post-excerpt').value = post.excerpt || '';
    bodyEditor.innerHTML = sanitizeEditorHtml(post.body || '');
    $('media-folder-label').textContent = post.media_folder || `blog-posts/${post.slug}`;
    $('delete-post-button').hidden = false;
    $('publish-post-button').disabled = post.status === 'published';
    $('publish-post-button').textContent = post.status === 'published' ? 'Bereits veröffentlicht' : 'Beitrag freigeben & veröffentlichen';
    setCoverPreview(post.cover_image);
    loadImages(post.id);
    renderPostList();
    showMessage(formMessage, 'Beitrag geladen.', '');
  }

  function startNewPost() {
    currentPost = null;
    form.reset();
    $('editor-heading').textContent = 'Neuen Beitrag vorbereiten';
    $('editor-status').outerHTML = '<span id="editor-status" class="status-pill">Noch nicht gespeichert</span>';
    $('post-slug').readOnly = false;
    $('slug-hint').textContent = 'Wird beim ersten Speichern als Teil der Artikeladresse verwendet.';
    bodyEditor.innerHTML = '';
    $('media-folder-label').textContent = 'Wird beim Speichern angelegt';
    $('delete-post-button').hidden = true;
    $('publish-post-button').disabled = true;
    $('publish-post-button').textContent = 'Beitrag freigeben & veröffentlichen';
    $('current-cover-preview').hidden = true;
    $('post-media-list').replaceChildren();
    showMessage(formMessage, 'Neuer Entwurf. Speichere ihn zuerst, danach kannst du Bilder hochladen.', '');
    renderPostList();
    $('post-title').focus();
  }

  async function savePost(status = 'draft') {
    const title = $('post-title').value.trim();
    const slug = slugify($('post-slug').value || title);
    const excerpt = $('post-excerpt').value.trim();
    const body = sanitizeEditorHtml(bodyEditor.innerHTML);
    if (!title) throw new Error('Bitte einen Titel eingeben.');
    if (!slug) throw new Error('Bitte einen gültigen URL-Kurznamen eingeben.');
    if (status === 'published' && !body.replace(/<[^>]*>/g, '').trim()) throw new Error('Bitte schreibe zuerst den Artikelinhalt.');

    const mediaFolder = currentPost?.media_folder || `blog-posts/${slug}`;
    const payload = {
      title, slug, excerpt, body,
      category: $('post-category').value,
      media_folder: mediaFolder,
      status,
      published_at: status === 'published' ? (currentPost?.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (currentPost?.id) {
      result = await client.from('blog_posts').update(payload).eq('id', currentPost.id)
        .select('id,title,slug,excerpt,body,category,cover_image,status,published_at,created_at,media_folder,updated_at').single();
    } else {
      result = await client.from('blog_posts').insert(payload)
        .select('id,title,slug,excerpt,body,category,cover_image,status,published_at,created_at,media_folder,updated_at').single();
    }
    if (result.error) throw result.error;
    currentPost = result.data;
    await ensureMediaFolder(currentPost);
    await loadPosts();
    loadPostIntoEditor(currentPost);
    return currentPost;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    $('save-draft-button').disabled = true;
    $('save-draft-button').textContent = 'Speichert …';
    try {
      await savePost('draft');
      showMessage(formMessage, 'Entwurf gespeichert. Der Beitrag ist noch nicht öffentlich.', 'success');
    } catch (error) {
      showMessage(formMessage, error.message || 'Der Entwurf konnte nicht gespeichert werden.', 'error');
    } finally {
      $('save-draft-button').disabled = false;
      $('save-draft-button').textContent = 'Entwurf speichern';
    }
  });

  $('publish-post-button').addEventListener('click', async () => {
    if (!currentPost?.id) { showMessage(formMessage, 'Bitte zuerst als Entwurf speichern.', 'error'); return; }
    if (!window.confirm('Diesen Beitrag jetzt öffentlich freigeben? Er erscheint danach auf der KI-&-Digital-Seite.')) return;
    $('publish-post-button').disabled = true;
    try {
      await savePost('published');
      showMessage(formMessage, 'Beitrag veröffentlicht. Er ist jetzt auf der Blogübersicht sichtbar.', 'success');
    } catch (error) {
      showMessage(formMessage, error.message || 'Veröffentlichen fehlgeschlagen.', 'error');
      $('publish-post-button').disabled = false;
    }
  });

  $('delete-post-button').addEventListener('click', async () => {
    if (!currentPost?.id || !window.confirm('Diesen Beitrag und seine Bilddateien endgültig löschen?')) return;
    try {
      const { data: images, error: imageError } = await client.from('blog_post_images').select('storage_path').eq('post_id', currentPost.id);
      if (imageError) throw imageError;
      const paths = (images || []).map((image) => image.storage_path).filter(Boolean);
      if (currentPost.media_folder) paths.push(`${currentPost.media_folder}/.folder.txt`);
      if (paths.length) {
        const { error: removeError } = await client.storage.from(BUCKET).remove([...new Set(paths)]);
        if (removeError) throw removeError;
      }
      const { error } = await client.from('blog_posts').delete().eq('id', currentPost.id);
      if (error) throw error;
      startNewPost();
      await loadPosts();
      showMessage(formMessage, 'Beitrag und zugehörige Bilder wurden gelöscht.', 'success');
    } catch (error) {
      showMessage(formMessage, error.message || 'Löschen fehlgeschlagen.', 'error');
    }
  });

  $('new-post-button').addEventListener('click', startNewPost);

  async function optimizeBlogImage(file) {
    if (!file || file.type === 'image/gif') return file;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return file;
    if (!('createImageBitmap' in window)) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const maxEdge = 1800;
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d', { alpha: true });
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
      if (!blob || blob.size >= file.size) return file;
      const base = file.name.replace(/\.[^.]+$/, '') || 'bild';
      return new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() });
    } catch (error) {
      console.warn('Bildoptimierung übersprungen:', error);
      return file;
    }
  }

  async function uploadImage(file, kind) {
    if (!currentPost?.id) throw new Error('Bitte zuerst den Entwurf speichern. Danach kannst du die Bilder hochladen.');
    if (!file || !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) throw new Error('Erlaubt sind JPG, PNG, WebP oder GIF.');
    if (file.size > 50 * 1024 * 1024) throw new Error('Das Bild darf maximal 50 MB groß sein.');
    const optimizedFile = await optimizeBlogImage(file);
    const extension = (optimizedFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const baseName = slugify(optimizedFile.name.replace(/\.[^.]+$/, '')) || 'bild';
    const folder = kind === 'cover' ? 'cover' : 'inline';
    const storagePath = `${currentPost.media_folder}/${folder}/${Date.now()}-${baseName}.${extension}`;
    const { error: uploadError } = await client.storage.from(BUCKET).upload(storagePath, optimizedFile, {
      contentType: optimizedFile.type, upsert: false, cacheControl: '31536000'
    });
    if (uploadError) throw uploadError;
    const { data: publicData } = client.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = publicData.publicUrl;
    const altText = window.prompt('Kurzer Alternativtext für das Bild (für Barrierefreiheit):', currentPost.title) || '';
    const { error: rowError } = await client.from('blog_post_images').insert({
      post_id: currentPost.id, storage_path: storagePath, public_url: publicUrl,
      alt_text: altText, image_kind: kind
    });
    if (rowError) {
      await client.storage.from(BUCKET).remove([storagePath]);
      throw rowError;
    }
    if (kind === 'cover') {
      const { error } = await client.from('blog_posts').update({ cover_image: publicUrl }).eq('id', currentPost.id);
      if (error) throw error;
      currentPost.cover_image = publicUrl;
      setCoverPreview(publicUrl);
    } else {
      const figure = document.createElement('figure');
      const img = document.createElement('img'); img.src = publicUrl; img.alt = altText; img.style.maxWidth = '100%';
      figure.appendChild(img);
      if (altText) { const caption = document.createElement('figcaption'); caption.textContent = altText; figure.appendChild(caption); }
      if (editorRange && bodyEditor.contains(editorRange.commonAncestorContainer)) {
        editorRange.deleteContents(); editorRange.insertNode(figure); editorRange.setStartAfter(figure); editorRange.collapse(true);
      } else bodyEditor.appendChild(figure);
      bodyEditor.focus();
      preserveEditorSelection();
    }
    await loadImages(currentPost.id);
    showMessage(formMessage, kind === 'cover' ? 'Titelbild hochgeladen.' : 'Bild hochgeladen und in den Text eingefügt. Speichere den Entwurf, damit die Bildposition übernommen wird.', 'success');
  }

  $('cover-upload').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try { await uploadImage(file, 'cover'); } catch (error) { showMessage(formMessage, error.message || 'Upload fehlgeschlagen.', 'error'); }
  });
  $('inline-upload').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try { await uploadImage(file, 'inline'); } catch (error) { showMessage(formMessage, error.message || 'Upload fehlgeschlagen.', 'error'); }
  });

  async function showAdmin() {
    loginPanel.hidden = true;
    adminApp.hidden = false;
    $('logout-button').hidden = false;
    await loadPosts();
  }

  async function verifyAdmin() {
    const { data: result, error } = await client.rpc('is_portfolio_admin');
    if (error) throw error;
    if (result !== true) throw new Error('Dieses Konto hat keine Blog-Administratorrechte.');
    await showAdmin();
  }

  if (!window.supabase || !cfg.url || !cfg.anonKey) {
    showMessage(loginMessage, 'Die Supabase-Konfiguration fehlt.', 'error');
    loginForm.hidden = true;
    return;
  }

  client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  client.auth.getSession().then(async ({ data, error }) => {
    if (error) return showMessage(loginMessage, error.message, 'error');
    if (!data.session) return;
    try { await verifyAdmin(); }
    catch (authError) { showMessage(loginMessage, authError.message, 'error'); }
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('admin-login-button');
    button.disabled = true; button.textContent = 'Anmeldung läuft …';
    try {
      const { error } = await client.auth.signInWithPassword({
        email: $('admin-email').value.trim(), password: $('admin-password').value
      });
      if (error) throw error;
      await verifyAdmin();
    } catch (error) {
      showMessage(loginMessage, error.message || 'Anmeldung fehlgeschlagen.', 'error');
    } finally {
      button.disabled = false; button.textContent = 'Anmelden';
    }
  });

  $('logout-button').addEventListener('click', async () => {
    await client.auth.signOut();
    location.reload();
  });
})();
