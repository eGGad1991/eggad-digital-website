export async function onRequest(context) {
  const slug = String(context.params?.slug || "").toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return new Response("Nicht gefunden", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex,follow" }
    });
  }
  const oldUrl = new URL(context.request.url);
  const destination = new URL(`/blog/${encodeURIComponent(slug)}/`, oldUrl.origin);
  destination.search = oldUrl.search;
  return new Response(null, {
    status: 301,
    headers: {
      Location: destination.toString(),
      "Cache-Control": "public, max-age=3600"
    }
  });
}
