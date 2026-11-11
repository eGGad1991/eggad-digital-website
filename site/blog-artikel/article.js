(() => {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const loading = document.getElementById('article-loading');
  const notFound = document.getElementById('article-not-found');
  const article = document.getElementById('blog-article');
  const bodyEl = document.getElementById('article-body');
  const galleryWrap = document.getElementById('article-gallery-wrap');
  const gallery = document.getElementById('article-gallery');
  let currentUrl = window.location.href;

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  };

  function safeArticleHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html || ''), 'text/html');
    const allowedTags = new Set(['P','H2','H3','H4','UL','OL','LI','STRONG','B','EM','I','A','BLOCKQUOTE','BR','HR','FIGURE','FIGCAPTION','IMG']);
    const cleanUrl = (value, isImage = false) => {
      try {
        const url = new URL(value, window.location.origin);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        if (isImage) {
          const storageBase = `${String(cfg.url || '').replace(/\/$/, '')}/storage/v1/object/public/${cfg.blogBucket || 'mila-blog-media'}/`;
          return url.href.startsWith(storageBase) ? url.href : '';
        }
        return url.href;
      } catch (_) { return ''; }
    };
    const cleanNode = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        if (!allowedTags.has(child.tagName)) {
          if (['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','INPUT','BUTTON','SVG','MATH','VIDEO','AUDIO'].includes(child.tagName)) {
            child.remove();
          } else {
            cleanNode(child);
            child.replaceWith(...child.childNodes);
          }
          return;
        }
        [...child.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (child.tagName === 'A' && name === 'href') {
            const cleaned = cleanUrl(attr.value, false);
            if (cleaned) child.setAttribute('href', cleaned); else child.removeAttribute('href');
          } else if (child.tagName === 'IMG' && name === 'src') {
            const cleaned = cleanUrl(attr.value, true);
            if (cleaned) child.setAttribute('src', cleaned); else child.remove();
          } else if ((child.tagName === 'A' && ['target','title'].includes(name)) || (child.tagName === 'IMG' && ['alt','title','width','height'].includes(name))) {
            if (name === 'target' && attr.value !== '_blank') child.removeAttribute(name);
          } else {
            child.removeAttribute(name);
          }
        });
        if (child.tagName === 'A' && child.getAttribute('target') === '_blank') child.setAttribute('rel', 'noopener noreferrer');
        cleanNode(child);
      });
    };
    cleanNode(doc.body);
    return doc.body.innerHTML;
  }

  function appendGalleryImage(image) {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = image.public_url;
    img.alt = image.alt_text || 'Bild aus dem Blogbeitrag';
    img.loading = 'lazy';
    img.decoding = 'async';
    figure.appendChild(img);
    if (image.alt_text) {
      const caption = document.createElement('figcaption');
      caption.textContent = image.alt_text;
      figure.appendChild(caption);
    }
    gallery.appendChild(figure);
  }

  async function loadArticle() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const slug = decodeURIComponent(parts.at(-1) || '');
    if (!slug || slug === 'index.html' || !window.supabase || !cfg.url || !cfg.anonKey) {
      loading.hidden = true;
      notFound.hidden = false;
      return;
    }

    const client = window.supabase.createClient(cfg.url, cfg.anonKey);
    const { data: post, error } = await client
      .from('blog_posts')
      .select('id,title,slug,excerpt,body,category,cover_image,published_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) console.error('Artikel konnte nicht geladen werden:', error);
    if (!post) {
      loading.hidden = true;
      notFound.hidden = false;
      return;
    }

    document.title = `${post.title} | KI & Digital | Mila`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', post.excerpt || post.title);
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index,follow,max-image-preview:large');
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${window.location.origin}/ki-digital/${encodeURIComponent(post.slug)}/`);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', post.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', post.excerpt || post.title);

    document.getElementById('article-category').textContent = post.category || 'KI & Digital';
    document.getElementById('article-date').textContent = formatDate(post.published_at);
    document.getElementById('article-title').textContent = post.title;
    document.getElementById('article-excerpt').textContent = post.excerpt || '';
    bodyEl.innerHTML = safeArticleHtml(post.body);

    if (post.cover_image) {
      const cover = document.getElementById('article-cover');
      cover.src = post.cover_image;
      cover.alt = `Titelbild: ${post.title}`;
      document.getElementById('article-cover-figure').hidden = false;
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', post.cover_image);
    }

    const { data: images, error: imagesError } = await client
      .from('blog_post_images')
      .select('public_url,alt_text,image_kind')
      .eq('post_id', post.id)
      .eq('image_kind', 'inline')
      .order('created_at', { ascending: true });

    if (imagesError) console.warn('Zusätzliche Bildinformationen konnten nicht geladen werden:', imagesError);
    const bodyImageUrls = new Set([...bodyEl.querySelectorAll('img')].map((img) => img.src));
    (images || []).filter((item) => item.public_url && !bodyImageUrls.has(item.public_url)).forEach(appendGalleryImage);
    if (gallery.children.length) galleryWrap.hidden = false;

    loading.hidden = true;
    article.hidden = false;
    document.getElementById('article-share').addEventListener('click', async () => {
      try {
        if (navigator.share) await navigator.share({ title: post.title, url: currentUrl });
        else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(currentUrl);
          document.getElementById('article-share').textContent = 'Link kopiert ✓';
        } else {
          window.prompt('Kopiere den Link:', currentUrl);
        }
      } catch (shareError) {
        if (shareError?.name !== 'AbortError') console.warn('Teilen nicht möglich:', shareError);
      }
    });
  }

  loadArticle().catch((error) => {
    console.error(error);
    loading.hidden = true;
    notFound.hidden = false;
  });
})();
