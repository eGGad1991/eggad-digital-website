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

function articleHtml(post, images, origin) {
  const canonical = `${origin}/ki-digital/${encodeURIComponent(post.slug)}/`;
  const title = `${post.title} | KI & Digital | Mila`;
  const description = metaDescription(post);
  const fallbackImage = `${origin}/assets/ki.webp`;
  const image = post.cover_image || fallbackImage;
  const published = post.published_at || post.created_at;
  const modified = post.updated_at || published;
  const body = safeArticleHtml(post.body, origin);
  const gallery = (images || []).filter((x) => x.public_url && !body.includes(x.public_url)).map((x) =>
    `<figure><img src="${esc(x.public_url)}" alt="${esc(x.alt_text || "Bild aus dem Blogbeitrag")}" loading="lazy" decoding="async">${x.alt_text ? `<figcaption>${esc(x.alt_text)}</figcaption>` : ""}</figure>`
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
        "articleSection": post.category || "KI & Digital",
        "inLanguage": "de-DE",
        "author": { "@type": "Organization", "name": "Mila (virtuelle Persönlichkeit)" },
        "publisher": { "@type": "Organization", "name": "Mila", "url": `${origin}/` }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Start", "item": `${origin}/` },
          { "@type": "ListItem", "position": 2, "name": "KI & Digital", "item": `${origin}/ki-digital/` },
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
<header><div class="bar"><a class="logo" href="/">mila<span>♡</span></a><button aria-label="Menü öffnen" class="mobile-toggle" onclick="document.querySelector('nav').classList.toggle('open')">☰</button><nav><a href="/">Start</a><a href="/ueber-mila/">Über Mila</a><a href="/gaming/">Gaming</a><a class="active" href="/ki-digital/">KI &amp; Digital</a><a href="/lifestyle/">Lifestyle</a><a href="/reisen/">Reisen</a><a href="/galerie/">Galerie</a><a href="/kontakt/">Kontakt</a></nav></div></header>
<div class="back-home-wrap"><a class="back-home-link" href="/ki-digital/">← Zurück zu KI &amp; Digital</a></div>
<main class="wrap blog-article-shell"><article class="blog-article">
<div class="article-topline"><span class="blog-category">${esc(post.category || "KI & Digital")}</span><time datetime="${esc(publishedIso)}">${esc(formatDate(published))}</time></div>
<h1>${esc(post.title)}</h1><p class="article-excerpt">${esc(post.excerpt || "")}</p>
${post.cover_image ? `<figure class="article-cover"><img src="${esc(post.cover_image)}" alt="Titelbild: ${esc(post.title)}" fetchpriority="high"></figure>` : ""}
<div class="article-body">${body}</div>
${gallery ? `<section class="article-gallery-wrap"><h2>Weitere Bilder</h2><div class="article-gallery">${gallery}</div></section>` : ""}
<p class="article-byline">Beitrag von Mila · virtuelle Persönlichkeit</p>
<div class="article-end"><a href="/ki-digital/" class="btn">Weitere Beiträge entdecken ↗</a><button id="article-share" class="share-button" type="button">Beitrag teilen</button></div>
</article></main>
<footer><a class="logo" href="/">mila<span>♡</span></a><div class="footerlinks"><a href="/impressum/">Impressum</a><a href="/datenschutz/">Datenschutz</a><a href="/kontakt/">Kontakt</a></div><p>Schön, dass du da bist. ♡</p><small>© 2026 Mila · Alle Rechte vorbehalten.</small><small class="disclosure">Mila ist eine virtuelle Persönlichkeit. Inhalte und Bilder werden mit KI gestaltet.</small></footer>
<script>document.getElementById('article-share')?.addEventListener('click',async()=>{const data={title:${JSON.stringify(post.title)},url:location.href};try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(data.url);document.getElementById('article-share').textContent='Link kopiert ✓';}else window.prompt('Kopiere den Link:',data.url);}catch(e){if(e?.name!=='AbortError')console.warn(e);}});</script>
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
      select: "id,title,slug,excerpt,body,category,cover_image,status,published_at,created_at,updated_at",
      slug: `eq.${slug}`, status: "eq.published", limit: "1"
    });
    const post = rows?.[0];
    if (!post) {
      return new Response(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>Beitrag nicht gefunden | Mila</title><link rel="stylesheet" href="/styles.css"></head><body><main class="wrap section"><h1>Dieser Beitrag ist gerade nicht verfügbar.</h1><p>Vielleicht wurde er verschoben oder noch nicht veröffentlicht.</p><a class="btn" href="/ki-digital/">Zur Blogübersicht</a></main></body></html>`, {
        status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex,follow" }
      });
    }
    let images = [];
    try {
      images = await fetchRows("blog_post_images", {
        select: "public_url,alt_text,image_kind", post_id: `eq.${post.id}`, image_kind: "eq.inline", order: "created_at.asc"
      });
    } catch (imageError) { console.warn("Blogbilder konnten nicht gelesen werden", imageError); }
    const body = articleHtml(post, images, url.origin);
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
