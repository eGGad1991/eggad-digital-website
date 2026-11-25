(() => {
  const card = document.getElementById("tag-2-card");
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const root = document.querySelector(".story-article");
  if (!card || !root || !window.supabase || !cfg.url || !cfg.anonKey) {
    if (card) card.innerHTML = '<span class="episode-number">TAG 02</span><strong>Gerade nicht erreichbar</strong><span class="episode-description">Der Abschnitt konnte nicht geladen werden.</span>';
    return;
  }

  const db = window.supabase.createClient(cfg.url, cfg.anonKey);
  const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);

  function inlineMarkdown(value) {
    return esc(value)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  }

  function renderMarkdown(markdown) {
    const blocks = String(markdown || "").replace(/\r/g, "").split(/\n\s*\n/);
    const rendered = [];
    for (const raw of blocks) {
      const line = raw.trim();
      if (!line) continue;
      if (/^#\s+/.test(line)) continue;
      if (/^\*Fortsetzung, psychologisch überarbeitete Fassung\*$/.test(line)) continue;
      if (/^###\s+/.test(line)) {
        rendered.push("<h3>" + inlineMarkdown(line.replace(/^###\s+/, "")) + "</h3>");
      } else if (/^##\s+/.test(line)) {
        rendered.push("<h2>" + inlineMarkdown(line.replace(/^##\s+/, "")) + "</h2>");
      } else if (/^>\s?/.test(line)) {
        rendered.push("<blockquote>" + inlineMarkdown(line.replace(/^>\s?/, "")) + "</blockquote>");
      } else if (/^(?:- |\* )/.test(line)) {
        const items = line.split("\n").map(x => "<li>" + inlineMarkdown(x.replace(/^(?:- |\* )/, "")) + "</li>").join("");
        rendered.push("<ul>" + items + "</ul>");
      } else {
        rendered.push("<p>" + inlineMarkdown(line).replace(/\n/g, "<br>") + "</p>");
      }
    }
    return rendered;
  }

  function insertSceneImage(blocks, image, pattern) {
    if (!image?.public_url) return;
    const index = blocks.findIndex(block => pattern.test(block.replace(/<[^>]+>/g, " ")));
    if (index < 0) return;
    const figure = '<figure class="story-image-slot"><img src="' + esc(image.public_url) +
      '" alt="' + esc(image.alt_text || image.title || "Szene aus Tag 2") +
      '" loading="lazy" decoding="async" style="display:block;width:100%;height:auto;border-radius:15px;">' +
      '<figcaption>' + esc(image.title || "") + '</figcaption></figure>';
    blocks.splice(index + 1, 0, figure);
  }

  async function loadDayTwo() {
    const { data: days, error } = await db.from("dark_romance_days")
      .select("id,day_number,title,excerpt,content,content_format")
      .eq("day_number", 2).eq("status", "published").limit(1);
    if (error) throw error;
    const day = days?.[0];
    if (!day) {
      card.innerHTML = '<span class="episode-number">TAG 02</span><strong>Demnächst verfügbar</strong><span class="episode-description">Der nächste Abschnitt ist noch nicht veröffentlicht.</span>';
      return;
    }

    const { data: images, error: imageError } = await db.from("dark_romance_images")
      .select("title,alt_text,public_url,sort_order")
      .eq("day_number", 2).order("sort_order", { ascending: true });
    if (imageError) console.warn("Tag-2-Bilder konnten nicht geladen werden", imageError);

    const imageList = images || [];
    const blocks = renderMarkdown(day.content);
    insertSceneImage(blocks, imageList[0], /Änni stand ein paar Schritte entfernt|Vor dem Hotel blieb sie stehen/i);
    insertSceneImage(blocks, imageList[1], /Das Café lag in einer Seitenstraße|Sie nahmen den Platz am Fenster/i);
    insertSceneImage(blocks, imageList[2], /Mila schloss auf und hielt die Tür offen/i);

    const article = document.createElement("article");
    article.className = "story-article";
    article.id = "tag-2";
    const title = document.createElement("h2");
    title.className = "story-title";
    title.textContent = "Tag 2 – " + day.title;
    const copy = document.createElement("div");
    copy.className = "story-copy";
    copy.innerHTML = blocks.join("\n");
    article.append(title, copy);
    root.insertAdjacentElement("afterend", article);

    card.classList.remove("episode-card-upcoming");
    card.classList.add("episode-card-active");
    card.href = "#tag-2";
    card.setAttribute("aria-label", "Tag 2 lesen: " + day.title);
    card.innerHTML = '<span class="episode-number">TAG 02</span><strong>' + esc(day.title) +
      '</strong><span class="episode-description">' + esc(day.excerpt || "Der zweite Tag der Geschichte.") +
      '</span><span class="episode-link">Jetzt lesen ↘</span>';
  }

  loadDayTwo().catch(error => {
    console.error("Dark Romance Tag 2 konnte nicht geladen werden:", error);
    card.innerHTML = '<span class="episode-number">TAG 02</span><strong>Gerade nicht erreichbar</strong><span class="episode-description">Bitte lade die Seite erneut.</span>';
  });
})();