(function () {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.anonKey.startsWith("HIER_")) return;

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  const bucket = cfg.bucket || "portfolio-media";
  const blogBucket = cfg.blogBucket || "mila-blog-media";

  // Neue Uploads landen gesammelt in "galerie". Alte Kategorie-Ordner bleiben sichtbar.
  const categories = ["galerie", "lifestyle", "gaming", "ki-digital", "reisen", "alltag"];

  function appendImage(grid, src, alt, dataset) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    if (dataset) {
      Object.entries(dataset).forEach(([key, value]) => {
        if (value) img.dataset[key] = value;
      });
    }
    grid.appendChild(img);
  }

  async function loadPortfolioImages() {
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

      (data || []).filter(file => file.name && !file.name.startsWith(".") && file.id).forEach(file => {
        const path = category + "/" + file.name;
        const { data: publicData } = client.storage.from(bucket).getPublicUrl(path);
        all.push({
          url: publicData.publicUrl,
          name: file.name,
          category,
          created: file.created_at || file.updated_at || ""
        });
      });
    }

    all.sort((a, b) => String(b.created).localeCompare(String(a.created)));
    if (!all.length) return;

    heading.hidden = false;
    all.forEach(item => {
      appendImage(
        grid,
        item.url,
        "Mila – " + item.category.replace(/-/g, " "),
        { gallerySource: "portfolio" }
      );
    });
  }

  async function loadBlogImages() {
    const grid = document.getElementById("mila-blog-gallery");
    const heading = document.getElementById("mila-blog-gallery-heading");
    if (!grid || !heading) return;

    // Die RLS-Regel in Supabase gibt anonymen Besuchern ausschließlich
    // Bilder aus veröffentlichten Blogbeiträgen frei.
    // Der private Speicher wird nie abgefragt.
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
      if (!src || seen.has(src)) return;
      seen.add(src);

      appendImage(
        grid,
        src,
        (item.alt_text || "").trim() || "Bild aus Milas Blog",
        {
          gallerySource: "blog",
          imageKind: item.image_kind || ""
        }
      );
    });

    heading.hidden = grid.children.length === 0;
  }

  async function load() {
    await Promise.allSettled([
      loadPortfolioImages(),
      loadBlogImages()
    ]);
  }

  load().catch(err => console.warn("Mila Galerie konnte nicht geladen werden:", err));
})();
