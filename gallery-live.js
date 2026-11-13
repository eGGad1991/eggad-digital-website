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

    // Inner join + Statusfilter: Nur Bilder, deren zugehöriger Blogbeitrag
    // veröffentlicht ist. Der private Bucket wird hier ausdrücklich nicht abgefragt.
    const { data, error } = await client
      .from("blog_post_images")
      .select("id, storage_path, alt_text, image_kind, created_at, blog_posts!inner(title, slug, status, published_at)")
      .eq("blog_posts.status", "published")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("Mila Blog-Galerie:", error.message);
      return;
    }

    const seen = new Set();
    (data || []).forEach(item => {
      if (!item.storage_path || seen.has(item.storage_path)) return;
      seen.add(item.storage_path);

      const { data: publicData } = client.storage.from(blogBucket).getPublicUrl(item.storage_path);
      if (!publicData || !publicData.publicUrl) return;

      const post = item.blog_posts || {};
      const fallbackAlt = post.title
        ? "Bild aus dem Blogbeitrag: " + post.title
        : "Bild aus Milas Blog";
      appendImage(
        grid,
        publicData.publicUrl,
        (item.alt_text || "").trim() || fallbackAlt,
        {
          gallerySource: "blog",
          blogSlug: post.slug || "",
          imageKind: item.image_kind || ""
        }
      );
    });

    if (grid.children.length > 0) {
      heading.hidden = false;
    }
  }

  async function load() {
    await Promise.allSettled([
      loadPortfolioImages(),
      loadBlogImages()
    ]);
  }

  load().catch(err => console.warn("Mila Galerie konnte nicht geladen werden:", err));
})();
