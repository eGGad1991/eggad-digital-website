(() => {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const grid = document.getElementById('blog-post-grid');
  const loading = document.getElementById('blog-loading');
  const empty = document.getElementById('blog-empty');
  const errorEl = document.getElementById('blog-error');
  const countEl = document.getElementById('blog-post-count');

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
    card.href = `/ki-digital/${encodeURIComponent(post.slug)}/`;
    card.setAttribute('aria-label', `${post.title} lesen`);

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
      placeholder.innerHTML = '<span>mila♡</span><small>KI &amp; DIGITAL</small>';
      card.appendChild(placeholder);
    }

    const content = document.createElement('div');
    content.className = 'blog-card-content';
    content.innerHTML = `
      <div class="blog-card-meta"><span class="blog-category">${escapeHtml(post.category || 'KI & Digital')}</span><time datetime="${escapeHtml(post.published_at || "")}">${escapeHtml(formatDate(post.published_at))}</time></div>
      <h3>${escapeHtml(post.title || 'Ohne Titel')}</h3>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <span class="blog-read-more">Beitrag lesen <span aria-hidden="true">↗</span></span>`;
    card.appendChild(content);
    return card;
  }

  async function loadPosts() {
    if (!window.supabase || !cfg.url || !cfg.anonKey || !cfg.blogBucket) {
      loading.hidden = true;
      errorEl.hidden = false;
      console.error('Blog-Konfiguration fehlt.');
      return;
    }
    const client = window.supabase.createClient(cfg.url, cfg.anonKey);
    const { data, error } = await client
      .from('blog_posts')
      .select('id,title,slug,excerpt,category,cover_image,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false });

    loading.hidden = true;
    if (error) {
      console.error('Blog konnte nicht geladen werden:', error);
      errorEl.hidden = false;
      return;
    }

    const posts = data || [];
    countEl.textContent = posts.length ? `${posts.length} ${posts.length === 1 ? 'Beitrag' : 'Beiträge'}` : '';
    if (!posts.length) {
      empty.hidden = false;
      return;
    }
    const fragment = document.createDocumentFragment();
    posts.forEach((post) => fragment.appendChild(makeCard(post)));
    grid.appendChild(fragment);
  }

  loadPosts().catch((error) => {
    console.error(error);
    loading.hidden = true;
    errorEl.hidden = false;
  });
})();
