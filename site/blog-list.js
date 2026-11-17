(() => {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const digitalGrid = document.getElementById('digital-post-grid');
  const everydayGrid = document.getElementById('everyday-post-grid');
  const digitalLoading = document.getElementById('digital-loading');
  const everydayLoading = document.getElementById('everyday-loading');
  const digitalEmpty = document.getElementById('digital-empty');
  const everydayEmpty = document.getElementById('everyday-empty');
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
    'ki', 'ki & digital', 'ki-tools', 'ki tools', 'social media', 'automation',
    'automatisierung', 'online marketing', 'technologie'
  ]);

  function isDigitalPost(post) {
    const category = String(post.category || '').trim().toLocaleLowerCase('de-DE');
    return digitalCategories.has(category);
  }

  async function loadPosts() {
    if (!window.supabase || !cfg.url || !cfg.anonKey || !digitalGrid || !everydayGrid) {
      digitalLoading.hidden = true;
      everydayLoading.hidden = true;
      digitalEmpty.hidden = false;
      everydayEmpty.hidden = false;
      console.error('Blog-Konfiguration fehlt.');
      return;
    }

    const client = window.supabase.createClient(cfg.url, cfg.anonKey);
    const { data, error } = await client
      .from('blog_posts')
      .select('id,title,slug,excerpt,category,cover_image,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false });

    digitalLoading.hidden = true;
    everydayLoading.hidden = true;
    if (error) {
      console.error('Blog konnte nicht geladen werden:', error);
      digitalEmpty.hidden = true;
      everydayEmpty.hidden = true;
      return;
    }

    const posts = data || [];
    const digitalPosts = posts.filter(isDigitalPost);
    const everydayPosts = posts.filter((post) => !isDigitalPost(post));

    digitalCount.textContent = digitalPosts.length ? `${digitalPosts.length} ${digitalPosts.length === 1 ? 'Beitrag' : 'Beiträge'}` : '';
    everydayCount.textContent = everydayPosts.length ? `${everydayPosts.length} ${everydayPosts.length === 1 ? 'Beitrag' : 'Beiträge'}` : '';

    digitalEmpty.hidden = digitalPosts.length > 0;
    everydayEmpty.hidden = everydayPosts.length > 0;

    const digitalFragment = document.createDocumentFragment();
    digitalPosts.forEach((post) => digitalFragment.appendChild(makeCard(post)));
    digitalGrid.appendChild(digitalFragment);

    const everydayFragment = document.createDocumentFragment();
    everydayPosts.forEach((post) => everydayFragment.appendChild(makeCard(post)));
    everydayGrid.appendChild(everydayFragment);
  }

  loadPosts().catch((error) => {
    console.error(error);
    digitalLoading.hidden = true;
    everydayLoading.hidden = true;
    digitalEmpty.hidden = false;
    everydayEmpty.hidden = false;
  });
})();
