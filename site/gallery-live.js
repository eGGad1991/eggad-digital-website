(function () {
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.anonKey.startsWith("HIER_")) return;
  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  const bucket = cfg.bucket || "portfolio-media";
  // Neue Uploads landen gesammelt in "galerie". Alte Kategorie-Ordner bleiben sichtbar.
  const categories = ["galerie", "lifestyle", "gaming", "ki-digital", "reisen", "alltag"];

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
  load().catch(err => console.warn("Mila Galerie konnte nicht geladen werden:", err));
})();