const SUPABASE_URL = "https://xspibbzwfwhmgvfowiye.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__BZ2_Uk1XlUGd1RLPOs7Cw_AyIuZj98";
const BLOG_BUCKET = "mila-blog-media";
const SITE_NAME = "Mila";

const esc = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

function plainText(value = "") {
  return String(value).replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ").trim();
}

function metaDescription(post) {
  const text = plainText(post.excerpt || post.body || post.title);
  if (text.length <= 155) return text;
  return text.slice(0, 152).replace(/\s+\S*$/, "") + "…";
}

function safeArticleHtml(input, siteOrigin) {
  const raw = String(input || "");
  const tokens = raw.split(/(<\/?[a-zA-Z][^>]*>)/g);
  const allowed = new Set(["p","h2","h3","h4","ul","ol","li","strong","b","em","i","a","blockquote","br","hr","figure","figcaption","img"]);
  const forbidden = new Set(["script","style","iframe","object","embed","svg","math","form","input","button","video","audio"]);
  const voidTags = new Set(["br","hr","img"]);
  const storagePrefix = `${SUPABASE_URL}/storage/v1/object/public/${BLOG_BUCKET}/`;
  let suppressed = null;
  let output = "";

  for (const token of tokens) {
    if (!token) continue;
    if (!token.startsWith("<")) {
      if (!suppressed) output += token.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      continue;
    }
    if (/^<!--/.test(token) || /^<!/.test(token)) continue;
    const match = token.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)([\s\S]*?)>$/);
    if (!match) { if (!suppressed) output += "&lt;"; continue; }
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    const attrs = match[3] || "";

    if (suppressed) {
      if (closing && tag === suppressed) suppressed = null;
      continue;
    }
    if (!closing && forbidden.has(tag)) { suppressed = tag; continue; }
    if (!allowed.has(tag)) continue;
    if (closing) {
      if (!voidTags.has(tag)) output += `</${tag}>`;
      continue;
    }

    if (tag === "a") {
      const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const hrefRaw = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? "") : "";
      let safeHref = "";
      try {
        const parsed = new URL(hrefRaw, siteOrigin);
        if (["http:","https:","mailto:"].includes(parsed.protocol)) safeHref = parsed.href;
      } catch (_) {}
      output += safeHref ? `<a href="${esc(safeHref)}" rel="noopener noreferrer">` : "<a>";
    } else if (tag === "img") {
      const srcMatch = attrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const altMatch = attrs.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const srcRaw = srcMatch ? (srcMatch[1] ?? srcMatch[2] ?? srcMatch[3] ?? "") : "";
      const alt = altMatch ? (altMatch[1] ?? altMatch[2] ?? altMatch[3] ?? "") : "";
      let safeSrc = "";
      try {
        const parsed = new URL(srcRaw, siteOrigin);
        if (parsed.href.startsWith(storagePrefix)) safeSrc = parsed.href;
      } catch (_) {}
      if (safeSrc) output += `<img src="${esc(safeSrc)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
    } else {
      output += `<${tag}>`;
    }
  }
  return output;
}

async function fetchRows(table, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Supabase ${table}: HTTP ${response.status}`);
  return response.json();
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Berlin" }).format(date);
}

function imageSectionNumber(image) {
  const alt = String(image?.alt_text || '').toLowerCase();
  if (/browser|website-server|sitzung wiedererkennen|session-id/.test(alt)) return 1;
  if (/einsatzbereiche|warenkorb|spracheinstellungen|nutzungsanalyse|personalisierte werbung/.test(alt)) return 2;
  if (/cookie-arten|session-cookies|first-party|third-party/.test(alt)) return 3;
  if (/einwilligung|datenschutz|cookie-banner|optionale cookies/.test(alt)) return 5;
  return 0;
}

function placeInlineImages(bodyHtml, images, post = {}) {
  // Recipe photos belong next to the cooking step they illustrate, not in a gallery at the bottom.
  if (post.slug === "einfache-bolognese-rezept") {
    let body = String(bodyHtml || "");
    const remaining = [];
    const storagePrefix = `${SUPABASE_URL}/storage/v1/object/public/${BLOG_BUCKET}/`;
    const list = (images || []).filter((item) => item?.public_url && !body.includes(item.public_url));

    for (const item of list) {
      let safeUrl = "";
      try {
        const parsed = new URL(item.public_url);
        if (parsed.href.startsWith(storagePrefix)) safeUrl = parsed.href;
      } catch (_) {}
      if (!safeUrl) { remaining.push(item); continue; }

      const identity = `${safeUrl} ${item.alt_text || ""}`.toLowerCase();
      let stepPattern = null;
      if (/hackfleisch[-_ ]anbraten|hackfleisch.*anbrat|anbrat.*hackfleisch/.test(identity)) {
        stepPattern = /schritt\s*2\b/i;
      } else if (/sosse[-_ ]koecheln|soße|sosse|köchel|koechel/.test(identity)) {
        stepPattern = /schritt\s*3\b/i;
      } else if (/fertige[-_ ]spaghetti|spaghetti|pasta|fertig.*gericht/.test(identity)) {
        stepPattern = /schritt\s*4\b/i;
      }

      const headings = [...body.matchAll(/<h[23]\b[^>]*>[\s\S]*?<\/h[23]>/gi)];
      const heading = stepPattern && headings.find((match) => stepPattern.test(plainText(match[0])));
      if (!heading) { remaining.push(item); continue; }

      // Place the photo after the complete step and before the next subheading.
      const nextHeading = headings.find((match) => match.index > heading.index);
      const insertion = nextHeading ? nextHeading.index : body.length;
      const figure = `<figure class="article-inline-image"><img src="${esc(safeUrl)}" alt="${esc(item.alt_text || "Rezeptfoto")}" loading="lazy" decoding="async"></figure>`;
      body = `${body.slice(0, insertion).replace(/\s*$/, "")}\n${figure}\n${body.slice(insertion)}`;
    }
    return { body, remaining };
  }

  // Air-fryer candied almond photos are placed beside the exact preparation steps.
  if (post.slug === "gebrannte-mandeln-airfryer") {
    let body = String(bodyHtml || "");
    const remaining = [];
    const storagePrefix = `${SUPABASE_URL}/storage/v1/object/public/${BLOG_BUCKET}/`;
    const list = (images || []).filter((item) => item?.public_url && !body.includes(item.public_url));

    for (const item of list) {
      let safeUrl = "";
      try {
        const parsed = new URL(item.public_url);
        if (parsed.href.startsWith(storagePrefix)) safeUrl = parsed.href;
      } catch (_) {}
      if (!safeUrl) { remaining.push(item); continue; }

      const identity = String(item.alt_text || "").toLowerCase();
      let paragraphPattern = null;
      if (/naturbelassene mandeln|mandeln.*backpapierschale/.test(identity)) {
        paragraphPattern = /Gib die 200 g ganzen Mandeln/i;
      } else if (/gibt zucker zu den mandeln/.test(identity)) {
        paragraphPattern = /Verteile den Zucker/i;
      } else if (/gibt vanillezucker und wasser/.test(identity)) {
        paragraphPattern = /Gib anschließend die 30 ml Wasser/i;
      } else if (/ruehrt ganze mandeln|rührt ganze mandeln/.test(identity)) {
        paragraphPattern = /Rühre die Mandeln/i;
      } else if (/praesentiert eine schale|präsentiert eine schale/.test(identity)) {
        paragraphPattern = /Lass die Mandeln vollständig auskühlen/i;
      }

      const paragraphs = [...body.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)];
      const paragraph = paragraphPattern && paragraphs.find((match) => paragraphPattern.test(plainText(match[0])));
      if (!paragraph) { remaining.push(item); continue; }

      const insertion = paragraph.index + paragraph[0].length;
      const figure = `<figure class="article-inline-image"><img src="${esc(safeUrl)}" alt="${esc(item.alt_text || "Rezeptfoto")}" loading="lazy" decoding="async"></figure>`;
      body = `${body.slice(0, insertion)}\n${figure}\n${body.slice(insertion)}`;
    }
    return { body, remaining };
  }

  let body = String(bodyHtml || '');
  const remaining = [];
  const storagePrefix = `${SUPABASE_URL}/storage/v1/object/public/${BLOG_BUCKET}/`;
  const list = (images || []).filter((item) => item?.public_url && !body.includes(item.public_url));

  for (const item of list) {
    let safeUrl = '';
    try {
      const parsed = new URL(item.public_url);
      if (parsed.href.startsWith(storagePrefix)) safeUrl = parsed.href;
    } catch (_) {}
    if (!safeUrl) { remaining.push(item); continue; }

    const sectionNumber = imageSectionNumber(item);
    const headings = [...body.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi)];
    const heading = headings.find((match) => {
      const label = match[0].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
      return new RegExp(`^${sectionNumber}\\s*\\.`, 'i').test(label);
    });
    if (!sectionNumber || !heading) { remaining.push(item); continue; }

    const start = heading.index + heading[0].length;
    const nextHeading = headings.find((match) => match.index > heading.index);
    const end = nextHeading ? nextHeading.index : body.length;
    const section = body.slice(start, end);
    let insertion = -1;

    if (sectionNumber === 1) {
      const paragraphs = [...section.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)];
      const sessionParagraph = paragraphs.find((match) => /session[- ]?id/i.test(match[0]));
      if (sessionParagraph) insertion = start + sessionParagraph.index + sessionParagraph[0].length;
      else if (paragraphs[0]) insertion = start + paragraphs[0].index + paragraphs[0][0].length;
    } else if (sectionNumber === 2) {
      const lists = [...section.matchAll(/<ul\b[^>]*>[\s\S]*?<\/ul>/gi)];
      if (lists.length) insertion = start + lists[0].index + lists[0][0].length;
    } else {
      // Cookie types and consent are best illustrated after the full explanation in that section.
      const contentNodes = [...section.matchAll(/<(?:p|ul|ol|blockquote)\b[^>]*>[\s\S]*?<\/(?:p|ul|ol|blockquote)>/gi)];
      if (contentNodes.length) {
        const last = contentNodes[contentNodes.length - 1];
        insertion = start + last.index + last[0].length;
      }
    }

    if (insertion < 0) { remaining.push(item); continue; }
    const figure = `<figure class="article-inline-image"><img src="${esc(safeUrl)}" alt="${esc(item.alt_text || 'Bild zum Blogbeitrag')}" loading="lazy" decoding="async"></figure>`;
    body = `${body.slice(0, insertion)}\n${figure}\n${body.slice(insertion)}`;
  }
  return { body, remaining };
}


function relatedPostsFor(currentPost, candidates) {
  const currentTags = new Set(
    (Array.isArray(currentPost.tags) ? currentPost.tags : []).map((tag) => String(tag).toLowerCase())
  );
  const currentCategory = String(currentPost.category || "").trim().toLowerCase();
  const scored = (candidates || [])
    .filter((candidate) => candidate && candidate.slug && candidate.slug !== currentPost.slug)
    .map((candidate) => {
      const tags = Array.isArray(candidate.tags) ? candidate.tags.map((tag) => String(tag).toLowerCase()) : [];
      const sharedTags = tags.filter((tag) => currentTags.has(tag)).length;
      const sameCategory = currentCategory && String(candidate.category || "").trim().toLowerCase() === currentCategory;
      return { post: candidate, score: sharedTags * 2 + (sameCategory ? 3 : 0) };
    });
  const byDate = (a, b) =>
    new Date(b.post.published_at || 0).getTime() - new Date(a.post.published_at || 0).getTime();
  const relevant = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score || byDate(a, b));
  const fallback = [...scored].sort(byDate);
  return (relevant.length ? relevant : fallback).slice(0, 3).map((item) => item.post);
}

function relatedPostsHtml(posts) {
  if (!posts || !posts.length) return "";
  const storagePrefix = SUPABASE_URL + "/storage/v1/object/public/" + BLOG_BUCKET + "/";
  const cards = posts.map((post) => {
    let image = "";
    try {
      const parsed = new URL(post.cover_image || "");
      if (parsed.href.startsWith(storagePrefix)) image = parsed.href;
    } catch (_) {}
    const imageHtml = image
      ? '<img src="' + esc(image) + '" alt="Titelbild: ' + esc(post.title) + '" loading="lazy" decoding="async">'
      : "";
    return '<a class="related-post-card" href="/blog/' + encodeURIComponent(post.slug) + '/" aria-label="' + esc(post.title) + ' lesen">' +
      imageHtml +
      '<span class="related-post-content">' +
        '<span class="related-post-category">' + esc(post.category || "Blog") + '</span>' +
        '<strong>' + esc(post.title || "Blogbeitrag") + '</strong>' +
        (post.excerpt ? '<span class="related-post-excerpt">' + esc(post.excerpt) + '</span>' : '') +
        '<span class="related-post-link">Beitrag lesen ↗</span>' +
      '</span></a>';
  }).join("");
  return '<section class="related-posts" aria-labelledby="related-posts-title">' +
    '<span class="eyebrow">WEITERLESEN</span>' +
    '<h2 id="related-posts-title">Das könnte dich auch interessieren</h2>' +
    '<div class="related-posts-grid">' + cards + '</div>' +
    '</section>';
}

function articleHtml(post, images, relatedPosts, origin) {
  const canonical = `${origin}/blog/${encodeURIComponent(post.slug)}/`;
  const title = `${post.title} | Blog | Mila`;
  const description = metaDescription(post);
  const fallbackImage = `${origin}/assets/ki.webp`;
  const image = post.cover_image || fallbackImage;
  const published = post.published_at || post.created_at;
  const modified = post.updated_at || published;
  const safeBody = safeArticleHtml(post.body, origin);
  const placed = placeInlineImages(safeBody, images, post);
  const body = placed.body;
  const gallery = placed.remaining.map((x) =>
    `<figure><img src="${esc(x.public_url)}" alt="${esc(x.alt_text || "Bild aus dem Blogbeitrag")}" loading="lazy" decoding="async"></figure>`
  ).join("");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "headline": post.title,
        "description": description,
        "image": [image],
        "datePublished": published,
        "dateModified": modified,
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
        "articleSection": post.category || "Blog",
        "inLanguage": "de-DE",
        "author": { "@type": "Organization", "name": "Mila (virtuelle Persönlichkeit)" },
        "publisher": { "@type": "Organization", "name": "Mila", "url": `${origin}/` }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Start", "item": `${origin}/` },
          { "@type": "ListItem", "position": 2, "name": "KI & Digital", "item": `${origin}/blog/` },
          { "@type": "ListItem", "position": 3, "name": post.title, "item": canonical }
        ]
      }
    ]
  };
  const schemaText = JSON.stringify(schema).replace(/</g, "\\u003c");
  const publishedIso = published ? new Date(published).toISOString() : "";
  const modifiedIso = modified ? new Date(modified).toISOString() : publishedIso;

  return `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#100e19"><meta name="author" content="Mila">
<title>${esc(title)}</title><link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article"><meta property="og:locale" content="de_DE"><meta property="og:site_name" content="Mila">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}">
<meta property="article:published_time" content="${esc(publishedIso)}"><meta property="article:modified_time" content="${esc(modifiedIso)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}">
<link rel="preconnect" href="${SUPABASE_URL}" crossorigin><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/blog.css">
<script type="application/ld+json">${schemaText}</script>
</head><body>
<header><button aria-label="Zur vorherigen Seite" class="article-back-button" id="article-back" title="Zur vorherigen Seite" type="button"><span aria-hidden="true">←</span><span class="back-label">Zurück</span></button><div class="bar"><a class="logo" href="/" aria-label="Zur Mila-Startseite" title="Zur Mila-Startseite">mila<span>♡</span><span class="visually-hidden">Zur Mila-Startseite</span></a><button aria-label="Menü öffnen" class="mobile-toggle" onclick="document.querySelector('nav').classList.toggle('open')">☰</button><nav><a href="/">Startseite</a><a href="/ueber-mila/">Über Mila</a><a href="/gaming/">Gaming</a><a class="active" href="/blog/">Blog</a><a href="/lifestyle/">Lifestyle</a><a href="/reisen/">Reisen</a><a href="/galerie/">Galerie</a><a href="/kontakt/">Kontakt</a></nav></div></header>
<div class="back-home-wrap"><a class="back-home-link" href="/blog/">← Zurück zum Blog</a></div>
<main class="wrap blog-article-shell"><article class="blog-article">
<div class="article-topline"><span class="blog-category">${esc(post.category || "Blog")}</span><time datetime="${esc(publishedIso)}">${esc(formatDate(published))}</time></div>
<h1>${esc(post.title)}</h1><p class="article-excerpt">${esc(post.excerpt || "")}</p>
${post.cover_image ? `<figure class="article-cover"><img src="${esc(post.cover_image)}" alt="Titelbild: ${esc(post.title)}" fetchpriority="high"></figure>` : ""}
<div class="article-body">${body}</div>
${gallery ? `<section class="article-gallery-wrap"><h2>Weitere Bilder</h2><div class="article-gallery">${gallery}</div></section>` : ""}
<p class="article-byline">Beitrag von Mila · virtuelle Persönlichkeit</p>
<div class="article-end"><a href="/blog/" class="btn">Weitere Beiträge entdecken ↗</a><button id="article-share" class="share-button" type="button">Beitrag teilen</button></div>
${relatedPostsHtml(relatedPosts)}
</article></main>
<footer><a class="logo" href="/" aria-label="Zur Mila-Startseite" title="Zur Mila-Startseite">mila<span>♡</span><span class="visually-hidden">Zur Mila-Startseite</span></a><div class="footerlinks"><a href="/impressum/">Impressum</a><a href="/datenschutz/">Datenschutz</a><a href="/kontakt/">Kontakt</a></div><p>Schön, dass du da bist. ♡</p><small>© 2026 Mila · Alle Rechte vorbehalten.</small><small class="disclosure">Mila ist eine virtuelle Persönlichkeit. Inhalte und Bilder werden mit KI gestaltet.</small></footer>
<script>document.getElementById('article-back')?.addEventListener('click',()=>{try{const previous=document.referrer?new URL(document.referrer):null;if(previous&&previous.origin===location.origin&&history.length>1)history.back();else location.assign('/blog/');}catch(_){location.assign('/blog/');}});document.getElementById('article-share')?.addEventListener('click',async()=>{const data={title:${JSON.stringify(post.title)},url:location.href};try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(data.url);document.getElementById('article-share').textContent='Link kopiert ✓';}else window.prompt('Kopiere den Link:',data.url);}catch(e){if(e?.name!=='AbortError')console.warn(e);}});</script>
<script defer src="/cookie-consent.js"></script></body></html>`;
}

export async function onRequest(context) {
  const slug = String(context.params?.slug || "").toLowerCase();
  const url = new URL(context.request.url);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return new Response("Nicht gefunden", { status: 404, headers: { "X-Robots-Tag": "noindex,follow" } });
  }
  try {
    const rows = await fetchRows("blog_posts", {
      select: "id,title,slug,excerpt,body,category,cover_image,status,published_at,created_at,updated_at,tags",
      slug: `eq.${slug}`, status: "eq.published", limit: "1"
    });
    const post = rows?.[0];
    if (!post) {
      return new Response(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>Beitrag nicht gefunden | Mila</title><link rel="stylesheet" href="/styles.css"></head><body><main class="wrap section"><h1>Dieser Beitrag ist gerade nicht verfügbar.</h1><p>Vielleicht wurde er verschoben oder noch nicht veröffentlicht.</p><a class="btn" href="/blog/">Zur Blogübersicht</a></main></body></html>`, {
        status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex,follow" }
      });
    }
    let images = [];
    try {
      images = await fetchRows("blog_post_images", {
        select: "public_url,alt_text,image_kind", post_id: `eq.${post.id}`, image_kind: "eq.inline", order: "created_at.asc"
      });
    } catch (imageError) { console.warn("Blogbilder konnten nicht gelesen werden", imageError); }
    let relatedPosts = [];
    try {
      const candidates = await fetchRows("blog_posts", {
        select: "id,title,slug,excerpt,category,cover_image,published_at,tags",
        status: "eq.published",
        order: "published_at.desc",
        limit: "100"
      });
      relatedPosts = relatedPostsFor(post, candidates);
    } catch (relatedError) {
      console.warn("Verwandte Blogbeiträge konnten nicht geladen werden", relatedError);
    }
    const body = articleHtml(post, images, relatedPosts, url.origin);
    return new Response(body, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=1800",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });
  } catch (error) {
    console.error("Blogartikel konnte nicht gerendert werden", error);
    return new Response("Der Blogbeitrag ist vorübergehend nicht verfügbar.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "60", "X-Robots-Tag": "noindex,follow" }
    });
  }
}
