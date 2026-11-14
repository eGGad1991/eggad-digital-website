(function () {
  const gridSelector = ".gallery";
  const lightbox = document.getElementById("mila-gallery-lightbox");
  const previewImage = document.getElementById("mila-gallery-preview-image");
  const closeButton = document.getElementById("mila-gallery-preview-close");
  if (!lightbox || !previewImage || !closeButton) return;

  let previousFocus = null;

  function openPreview(image) {
    if (!(image instanceof HTMLImageElement)) return;
    previousFocus = image;
    previewImage.src = image.currentSrc || image.src;
    previewImage.alt = image.alt || "Bild aus Milas Galerie";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  function closePreview() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    previewImage.removeAttribute("src");
    document.body.style.overflow = "";
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  // Delegation also covers images that are loaded from Supabase after page load.
  document.addEventListener("click", function (event) {
    const image = event.target.closest(gridSelector + " img");
    if (image) {
      event.preventDefault();
      openPreview(image);
      return;
    }
    if (event.target === lightbox || event.target === closeButton) closePreview();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closePreview();
    if ((event.key === "Enter" || event.key === " ") && event.target.matches(gridSelector + " img")) {
      event.preventDefault();
      openPreview(event.target);
    }
  });

  document.querySelectorAll(gridSelector + " img").forEach(function (image) {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", (image.alt || "Galeriebild") + " vergrößert anzeigen");
  });

  const observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        if (!(node instanceof Element)) return;
        const images = node.matches(gridSelector + " img") ? [node] : Array.from(node.querySelectorAll(gridSelector + " img"));
        images.forEach(function (image) {
          image.tabIndex = 0;
          image.setAttribute("role", "button");
          image.setAttribute("aria-label", (image.alt || "Galeriebild") + " vergrößert anzeigen");
        });
      });
    });
  });
  document.querySelectorAll(gridSelector).forEach(function (grid) {
    observer.observe(grid, { childList: true, subtree: true });
  });

  closeButton.addEventListener("click", closePreview);
})();
