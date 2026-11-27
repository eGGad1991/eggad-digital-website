(() => {
  const root = document.getElementById("story-content");
  const cfg = window.MILA_SUPABASE_CONFIG || {};
  if (!root || !window.supabase || !cfg.url || !cfg.anonKey) {
    if (root) root.innerHTML = "<p>Der Beitrag ist gerade nicht erreichbar. Bitte lade die Seite erneut.</p>";
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
      if (!line || /^#\s+/.test(line) || /^\*Fortsetzung, psychologisch überarbeitete Fassung\*$/.test(line)) continue;
      if (/^###\s+/.test(line)) rendered.push("<h3>" + inlineMarkdown(line.replace(/^###\s+/, "")) + "</h3>");
      else if (/^##\s+/.test(line)) rendered.push("<h2>" + inlineMarkdown(line.replace(/^##\s+/, "")) + "</h2>");
      else if (/^>\s?/.test(line)) rendered.push("<blockquote>" + inlineMarkdown(line.replace(/^>\s?/, "")) + "</blockquote>");
      else rendered.push("<p>" + inlineMarkdown(line).replace(/\n/g, "<br>") + "</p>");
    }
    return rendered;
  }
  function addImage(blocks, image, pattern) {
    if (!image?.public_url) return;
    const index = blocks.findIndex(block => pattern.test(block.replace(/<[^>]+>/g, " ")));
    if (index < 0) return;
    const figure = '<figure class="story-image-slot"><img src="' + esc(image.public_url) +
      '" alt="' + esc(image.alt_text || image.title || "Szene aus Tag 2") +
      '" loading="lazy" decoding="async"><figcaption>' + esc(image.title || "") +
      "</figcaption></figure>";
    blocks.splice(index + 1, 0, figure);
  }
  async function load() {
    const {data:days,error}=await db.from("dark_romance_days")
      .select("id,day_number,title,excerpt,content,content_format")
      .eq("day_number",2).eq("status","published").limit(1);
    if(error) throw error;
    const day=days?.[0];
    if(!day) { root.innerHTML="<p>Dieser Tag ist noch nicht veröffentlicht.</p>"; return; }
    const {data:images,error:imageError}=await db.from("dark_romance_images")
      .select("title,alt_text,public_url,sort_order")
      .eq("day_number",2).order("sort_order",{ascending:true});
    if(imageError) console.warn("Tag-2-Bilder konnten nicht geladen werden",imageError);
    const audioSection=document.getElementById("dark-romance-audio");
    const audioPlayer=document.getElementById("dark-romance-audio-player");
    const audioNote=document.getElementById("dark-romance-audio-note");
    if(audioSection&&audioPlayer){
      const audioUrl="/assets/audio/Mila%20Tag%202_mix.mp3";
      audioPlayer.preload="metadata";
      audioPlayer.src=audioUrl;
      document.getElementById("dark-romance-audio-title").textContent="Die Geschichte anhören · Tag 2";
      audioNote.textContent="Originalaufnahme wird geladen …";
      audioPlayer.addEventListener("loadedmetadata",()=>{
        const duration=Number.isFinite(audioPlayer.duration)?Math.round(audioPlayer.duration):null;
        audioNote.textContent="Originalaufnahme"+(duration?" · "+Math.floor(duration/60)+":"+String(duration%60).padStart(2,"0")+" Minuten":"");
      },{once:true});
      audioPlayer.addEventListener("canplay",()=>{
        audioNote.textContent="Die Aufnahme ist abspielbereit.";
      },{once:true});
      audioPlayer.addEventListener("error",()=>{
        const code=audioPlayer.error?.code||0;
        const reasons={
          1:"Der Ladevorgang wurde abgebrochen.",
          2:"Die Audiodatei konnte vom Website-Server nicht geladen werden.",
          3:"Der Browser kann die Audiodatei nicht decodieren (Format/Codec).",
          4:"Der Browser erkennt das Audioformat nicht."
        };
        audioNote.textContent=(reasons[code]||"Die Audiodatei konnte nicht abgespielt werden")+" Fehlercode: "+code+".";
      },{once:true});
      audioSection.hidden=false;
      audioPlayer.load();
    }
    const blocks=renderMarkdown(day.content);
    const list=images||[];
    addImage(blocks,list[0],/Änni stand ein paar Schritte entfernt|Vor dem Hotel blieb sie stehen/i);
    addImage(blocks,list[1],/Das Café lag in einer Seitenstraße|Sie nahmen den Platz am Fenster/i);
    addImage(blocks,list[2],/Mila schloss auf und hielt die Tür offen/i);
    document.getElementById("story-title").textContent="Tag 2 – "+day.title;
    document.getElementById("story-excerpt").textContent=day.excerpt||"Ein Wiedersehen, ein Abend zu zweit und eine Wahrheit, die alles verändert.";
    root.innerHTML=blocks.join("\n");
    document.title="Tag 2 – "+day.title+" | Dark Romance – Mila";
  }
  load().catch(error=>{
    console.error("Dark Romance Tag 2 konnte nicht geladen werden:",error);
    root.innerHTML="<p>Der Beitrag konnte gerade nicht geladen werden. Bitte versuche es später erneut.</p>";
  });
})();