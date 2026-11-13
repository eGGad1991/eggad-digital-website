(function () {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.anonKey.startsWith("HIER_")) return;
  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  const bucket = cfg.bucket || "portfolio-media";
  // Neue Uploads landen gesammelt in "galerie". Alte Kategorie-Ordner bleiben sichtbar.
  const categories = ["galerie", "lifestyle", "gaming", "ki-digital", "reisen", "alltag"];


  async function loadBlogImages() {
    const grid = document.getElementById("mila-blog-gallery");
    const heading = document.getElementById("mila-blog-gallery-heading");
    if (!grid || !heading) return;

    // Öffentliche RLS-Regel liefert nur Bilder veröffentlichter Blogbeiträge.
    // Zusätzlich werden ausschließlich URLs aus mila-blog-media akzeptiert.
    const all = [];
    const pageSize = 500;
    let offset = 0;

    while (true) {
      const { data: page, error } = await client
        .from("blog_post_images")
        .select("id, public_url, alt_text, image_kind, created_at")
        .like("public_url", "%/mila-blog-media/%")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("Mila Blog-Galerie konnte nicht geladen werden:", error.message);
        return;
      }

      all.push(...(page || []));
      if (!page || page.length < pageSize) break;
      offset += pageSize;
    }

    const seen = new Set();
    all.forEach(item => {
      const src = (item.public_url || "").trim();
      if (!src || seen.has(src) || !src.includes("/mila-blog-media/")) return;
      seen.add(src);

      const img = document.createElement("img");
      img.src = src;
      img.alt = (item.alt_text || "").trim() || "Bild aus Milas Blog";
      img.loading = "lazy";
      img.decoding = "async";
      img.dataset.gallerySource = "blog";
      if (item.image_kind) img.dataset.imageKind = item.image_kind;
      grid.appendChild(img);
    });

    heading.hidden = grid.children.length === 0;
  }

  async function load() {
    const grid = document.getElementById("mila-live-gallery");
    const heading = document.getElementById("mila-live-gallery-heading");
    if (!grid) return;
    const all = [];
    for (const category of categories) {
      const { data, error } = await client.storage.from(bucket).list(category, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" }
      });
      if (error) {
        console.warn("Mila Galerie:", error.message);
        continue;
      }
      (data || []).filter(x => x.name && !x.name.startsWith(".") && x.id).forEach(file => {
        const { data: publicData } = client.storage.from(bucket).getPublicUrl(category + "/" + file.name);
        all.push({ url: publicData.publicUrl, name: file.name, category, created: file.created_at || file.updated_at || "" });
      });
    }
    all.sort((a, b) => String(b.created).localeCompare(String(a.created)));
    if (!all.length) return;
    heading.hidden = false;
    all.forEach(item => {
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = "Mila – " + item.category.replace("-", " ");
      img.loading = "lazy";
      img.decoding = "async";
      grid.appendChild(img);
    });
  }
  Promise.allSettled([load(), loadBlogImages()]).catch(err => console.warn("Mila Galerie konnte nicht geladen werden:", err));
})();