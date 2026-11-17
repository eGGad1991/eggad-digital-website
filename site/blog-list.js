(() => {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const digitalGrid = document.getElementById('digital-post-grid');
  const everydayGrid = document.getElementById('everyday-post-grid');

  // The blog landing page is a topic chooser. Only pillar pages render feeds.
  if (!digitalGrid && !everydayGrid) return;

  const digitalLoading = document.getElementById('digital-loading');
  const everydayLoading = document.getElementById('everyday-loading');
  const digitalEmpty = document.getElementById('digital-empty');
  const everydayEmpty = document.getElementById('everyday-empty');
  const digitalError = document.getElementById('digital-error');
  const everydayError = document.getElementById('everyday-error');
  const digitalCount = document.getElementById('digital-post-count');
  const everydayCount = document.getElementById('everyday-post-count');

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  };

  function makeCard(post) {
    const card = document.createElement('a');
    card.className = 'blog-card';
    card.href = `/blog/${encodeURIComponent(post.slug)}/`;
    card.setAttribute('aria-label', `${post.title || 'Beitrag'} lesen`);

    if (post.cover_image) {
      const media = document.createElement('div');
      media.className = 'blog-card-media';
      const img = document.createElement('img');
      img.src = post.cover_image;
      img.alt = post.title ? `Titelbild: ${post.title}` : 'Titelbild zum Blogbeitrag';
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);
      card.appendChild(media);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'blog-card-placeholder';
      placeholder.innerHTML = '<span>mila♡</span><small>BLOG</small>';
      card.appendChild(placeholder);
    }

    const content = document.createElement('div');
    content.className = 'blog-card-content';
    content.innerHTML = `
      <div class="blog-card-meta"><span class="blog-category">${escapeHtml(post.category || 'Blog')}</span><time datetime="${escapeHtml(post.published_at || '')}">${escapeHtml(formatDate(post.published_at))}</time></div>
      <h3>${escapeHtml(post.title || 'Ohne Titel')}</h3>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <span class="blog-read-more">Beitrag lesen <span aria-hidden="true">↗</span></span>`;
    card.appendChild(content);
    return card;
  }

  const digitalCategories = new Set([
    'seo', 'datenschutz', 'digitales marketing', 'website', 'webseite',
    'ki', 'ki & digital', 'ki-tools', 'ki tools', 'social media',
    'automation', 'automatisierung', 'online marketing', 'technologie',
    'digital', 'digitale tools', 'online-marketing'
  ]);

  function isDigitalPost(post) {
    const category = String(post.category || '').trim().toLocaleLowerCase('de-DE');
    return digitalCategories.has(category);
  }

  function finishLoading() {
    if (digitalLoading) digitalLoading.hidden = true;
    if (everydayLoading) everydayLoading.hidden = true;
  }

  async function loadPosts() {
    const targets = [
      { grid: digitalGrid, empty: digitalEmpty, error: digitalError, count: digitalCount, predicate: isDigitalPost },
      { grid: everydayGrid, empty: everydayEmpty, error: everydayError, count: everydayCount, predicate: (post) => !isDigitalPost(post) }
    ].filter((target) => target.grid);

    if (!window.supabase || !cfg.url || !cfg.anonKey) {
      finishLoading();
      targets.forEach((target) => { if (target.error) target.error.hidden = false; });
      console.error('Blog-Konfiguration fehlt.');
      return;
    }

    const client = window.supabase.createClient(cfg.url, cfg.anonKey);
    const { data, error } = await client
      .from('blog_posts')
      .select('id,title,slug,excerpt,category,cover_image,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false });

    finishLoading();
    if (error) {
      console.error('Blog konnte nicht geladen werden:', error);
      targets.forEach((target) => { if (target.error) target.error.hidden = false; });
      return;
    }

    const posts = data || [];
    targets.forEach((target) => {
      const filtered = posts.filter(target.predicate);
      if (target.count) {
        target.count.textContent = filtered.length
          ? `${filtered.length} ${filtered.length === 1 ? 'Beitrag' : 'Beiträge'}`
          : '';
      }
      if (target.empty) target.empty.hidden = filtered.length > 0;
      const fragment = document.createDocumentFragment();
      filtered.forEach((post) => fragment.appendChild(makeCard(post)));
      target.grid.appendChild(fragment);
    });
  }

  loadPosts().catch((error) => {
    console.error(error);
    finishLoading();
    if (digitalError && digitalGrid) digitalError.hidden = false;
    if (everydayError && everydayGrid) everydayError.hidden = false;
  });
})();
