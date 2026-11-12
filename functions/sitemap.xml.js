const SUPABASE_URL = "https://xspibbzwfwhmgvfowiye.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__BZ2_Uk1XlUGd1RLPOs7Cw_AyIuZj98";
const PUBLIC_PATHS = ["/", "/ueber-mila/", "/gaming/", "/blog/", "/lifestyle/", "/reisen/", "/galerie/", "/kontakt/"];
const xml = (value) => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&apos;");

export async function onRequest({ request }) {
  const origin = new URL(request.url).origin;
  const entries = PUBLIC_PATHS.map((path) => ({ loc: `${origin}${path}`, lastmod: "2026-11-11" }));
  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/blog_posts`);
    url.searchParams.set("select", "slug,published_at,updated_at");
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("order", "published_at.desc");
    const response = await fetch(url, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: "application/json" } });
    if (!response.ok) throw new Error(`Supabase sitemap query failed: ${response.status}`);
    const posts = await response.json();
    for (const post of posts || []) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug || "")) continue;
      entries.push({
        loc: `${origin}/blog/${encodeURIComponent(post.slug)}/`,
        lastmod: post.updated_at || post.published_at || "2026-11-11"
      });
    }
  } catch (error) {
    console.error("Dynamische Blogeinträge konnten nicht in die Sitemap geladen werden", error);
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url><loc>${xml(entry.loc)}</loc><lastmod>${xml(new Date(entry.lastmod).toISOString().slice(0,10))}</lastmod></url>`).join("\n")}\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=1800", "X-Content-Type-Options": "nosniff" } });
}
