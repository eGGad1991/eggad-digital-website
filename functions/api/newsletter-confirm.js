export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const token = (requestUrl.searchParams.get("token") || "").trim();
  const action = (requestUrl.searchParams.get("action") || "confirm").trim();

  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return json({ ok: false, message: "Der Bestätigungslink ist unvollständig oder ungültig." }, 400);
  }
  if (!["confirm", "unsubscribe"].includes(action)) {
    return json({ ok: false, message: "Diese Anfrage ist nicht gültig." }, 400);
  }

  const appsScriptUrl = "https://script.google.com/macros/s/AKfycbyrNaA7YIQdaPNIU5jlIAqhzkMnR8HDMhmCs43EMEG8MyqRAGHYQjeDON_fVfiTMkBHyw/exec";
  const target = new URL(appsScriptUrl);
  target.searchParams.set("format", "json");
  target.searchParams.set("action", action);
  target.searchParams.set("token", token);

  try {
    const upstream = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      headers: { "Accept": "application/json" }
    });
    const body = await upstream.text();

    let result;
    try {
      result = JSON.parse(body);
    } catch {
      return json({
        ok: false,
        message: "Der Bestätigungsdienst hat keine gültige Antwort geliefert. Bitte versuche es später erneut."
      }, 502);
    }

    return json(result, upstream.ok ? 200 : upstream.status);
  } catch (error) {
    return json({
      ok: false,
      message: "Der Bestätigungsdienst ist gerade nicht erreichbar. Bitte versuche es später erneut."
    }, 502);
  }
}
