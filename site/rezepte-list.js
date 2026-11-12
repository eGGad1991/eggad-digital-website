(() => {
  "use strict";

  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const grid = document.getElementById("recipe-post-grid");
  const loading = document.getElementById("recipe-loading");
  const empty = document.getElementById("recipe-empty");
  const errorEl = document.getElementById("recipe-error");
  const countEl = document.getElementById("recipe-post-count");

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit", month: "long", year: "numeric"
    }).format(date);
  };

  function makeCard(post) {
    const card = document.createElement("a");
    card.className = "blog-card";
    card.href = "/blog/" + encodeURIComponent(post.slug) + "/";
    card.setAttribute("aria-label", (post.title || "Rezept") + " lesen");

    if (post.cover_image) {
      const media = document.createElement("div");
      media.className = "blog-card-media";
      const img = document.createElement("img");
      img.src = post.cover_image;
      img.alt = post.title ? "Titelbild: " + post.title : "Titelbild zum Rezept";
      img.loading = "lazy";
      img.decoding = "async";
      media.appendChild(img);
      card.appendChild(media);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "blog-card-placeholder";
      placeholder.innerHTML = "<span>mila♡</span><small>REZEPTE</small>";
      card.appendChild(placeholder);
    }

    const content = document.createElement("div");
    content.className = "blog-card-content";
    content.innerHTML =
      '<div class="blog-card-meta"><span class="blog-category">Rezept</span><time datetime="' +
      escapeHtml(post.published_at || "") + '">' + escapeHtml(formatDate(post.published_at)) +
      '</time></div><h3>' + escapeHtml(post.title || "Rezept") + '</h3><p>' +
      escapeHtml(post.excerpt || "") +
      '</p><span class="blog-read-more">Rezept ansehen <span aria-hidden="true">↗</span></span>';
    card.appendChild(content);
    return card;
  }

  async function loadRecipes() {
    if (!window.supabase || !cfg.url || !cfg.anonKey || !grid) {
      if (loading) loading.hidden = true;
      if (errorEl) errorEl.hidden = false;
      console.error("Rezept-Konfiguration fehlt.");
      return;
    }

    const client = window.supabase.createClient(cfg.url, cfg.anonKey);
    const { data, error } = await client
      .from("blog_posts")
      .select("id,title,slug,excerpt,cover_image,published_at")
      .eq("status", "published")
      .eq("category", "Rezepte")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (loading) loading.hidden = true;
    if (error) {
      console.error("Rezepte konnten nicht geladen werden:", error);
      if (errorEl) errorEl.hidden = false;
      return;
    }

    const recipes = data || [];
    if (countEl) {
      countEl.textContent = recipes.length
        ? recipes.length + (recipes.length === 1 ? " Rezept" : " Rezepte")
        : "";
    }
    if (!recipes.length) {
      if (empty) empty.hidden = false;
      return;
    }

    const fragment = document.createDocumentFragment();
    recipes.forEach((post) => fragment.appendChild(makeCard(post)));
    grid.appendChild(fragment);
  }

  loadRecipes().catch((error) => {
    console.error(error);
    if (loading) loading.hidden = true;
    if (errorEl) errorEl.hidden = false;
  });
})();
