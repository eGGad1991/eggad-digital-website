(() => {
  const form=document.getElementById("unlock-form");
  const input=document.getElementById("story-password");
  const button=document.getElementById("unlock-button");
  const status=document.getElementById("lock-status");
  const gate=document.getElementById("password-gate");
  const unlocked=document.getElementById("story-unlocked");
  const storyRoot=document.getElementById("story-content");
  const audio=document.getElementById("tag4-audio");
  const audioNote=document.getElementById("tag4-audio-note");
  if(!form||!window.supabase||!window.MILA_SUPABASE_CONFIG)return;
  const cfg=window.MILA_SUPABASE_CONFIG;
  const db=window.supabase.createClient(cfg.url,cfg.anonKey);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function renderMarkdown(markdown){
    return String(markdown||"").replace(/\r/g,"").split(/\n\s*\n/).map(raw=>{
      const line=raw.trim();
      if(!line||/^#\s+/.test(line))return "";
      if(line==="---")return '<hr class="story-divider">';
      if(/^###\s+/.test(line))return "<h3>"+inline(line.replace(/^###\s+/,""))+"</h3>";
      if(/^##\s+/.test(line))return "<h2>"+inline(line.replace(/^##\s+/,""))+"</h2>";
      if(/^>\s?/.test(line))return "<blockquote>"+inline(line.replace(/^>\s?/,""))+"</blockquote>";
      return "<p>"+inline(line).replace(/\n/g,"<br>")+"</p>";
    }).join("\n");
  }
  function inline(s){
    return esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>");
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const password=input.value;
    if(!password)return;
    button.disabled=true;button.textContent="Prüfe …";status.textContent="";
    try{
      const {data,error}=await db.rpc("unlock_dark_romance_day4",{p_password:password});
      if(error)throw error;
      const day=data?.[0];
      if(!day){status.textContent="Das Passwort stimmt leider nicht.";input.value="";input.focus();return;}
      document.title="Tag 4 – "+day.title+" | Dark Romance – Mila";
      storyRoot.innerHTML=renderMarkdown(day.content);
      gate.hidden=true;unlocked.hidden=false;
      audio.src="/assets/audio/Mila_Tag_4_Teil_1.mp3";
      audio.load();
      audio.addEventListener("ended",()=>{
        if(audio.dataset.part!=="2"){
          audio.dataset.part="2";
          audio.src="/assets/audio/Mila_Tag_4_Teil_2.mp3";
          audioNote.textContent="Teil 2 von 2 · Die Wiedergabe wird fortgesetzt.";
          audio.load();
          audio.play().catch(()=>{audioNote.textContent="Teil 1 beendet. Bitte Teil 2 über Play starten.";});
        }
      });
      audio.addEventListener("error",()=>{audioNote.textContent="Die Audiodatei konnte nicht geladen werden. Bitte später erneut versuchen.";});
      audioNote.textContent="Teil 1 von 2 · Nach dem ersten Teil startet Teil 2 automatisch.";
    }catch(error){
      console.error("Tag 4 konnte nicht freigeschaltet werden:",error);
      status.textContent="Der Zugang konnte gerade nicht geprüft werden. Bitte versuche es erneut.";
    }finally{
      button.disabled=false;button.textContent="Freischalten";
    }
  });
})();