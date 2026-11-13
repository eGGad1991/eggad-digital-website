const FILE_KEY = "Valheim-Welt-Backup-oeffentlich.zip";
const FILE_NAME = "Valheim-Welt-Backup-oeffentlich.zip";

function unavailable(message, status) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function fileHeaders(object) {
  const headers = new Headers({
    "Content-Type": "application/zip",
    "Content-Disposition": 'attachment; filename="' + FILE_NAME + '"',
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
    "X-Content-Type-Options": "nosniff",
    "Content-Length": String(object.size)
  });
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  if (object.uploaded) headers.set("Last-Modified", object.uploaded.toUTCString());
  return headers;
}

export async function onRequest({ request, env, params }) {
  if (params.filename !== FILE_NAME) return unavailable("Datei nicht gefunden.", 404);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed.", {
      status: 405,
      headers: { "Allow": "GET, HEAD", "Cache-Control": "no-store" }
    });
  }

  const bucket = env.MILA_DOWNLOADS;
  if (!bucket) return unavailable("Der öffentliche Dateispeicher ist noch nicht verbunden.", 503);

  try {
    if (request.method === "HEAD") {
      const object = await bucket.head(FILE_KEY);
      if (!object) return unavailable("Die Datei wurde noch nicht hochgeladen.", 404);
      return new Response(null, { status: 200, headers: fileHeaders(object) });
    }

    const object = await bucket.get(FILE_KEY);
    if (!object) return unavailable("Die Datei wurde noch nicht hochgeladen.", 404);
    return new Response(object.body, { status: 200, headers: fileHeaders(object) });
  } catch (error) {
    console.error("R2 download failed", error);
    return unavailable("Der Download ist vorübergehend nicht verfügbar.", 503);
  }
}
