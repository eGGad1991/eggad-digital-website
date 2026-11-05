(() => {
  const cfg = window.PORTFOLIO_CONFIG || {};
  const clientLib = window.supabase;
  const supabase = (clientLib && cfg.supabaseUrl && cfg.supabaseKey)
    ? clientLib.createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const state = { profile:null, drawers:[], projects:[], activeProject:null, blocks:[], editingBlock:null };
  const defaultDrawers = [
    {title:"Über mich",slug:"ueber-mich",description:"Mein beruflicher Weg, meine Interessen und meine Motivation."},
    {title:"Meine Fähigkeiten",slug:"faehigkeiten",description:"Kompetenzen und Werkzeuge, mit denen ich arbeite."},
    {title:"Weiterbildung",slug:"weiterbildung",description:"Meine Weiterbildung im Bereich Digital Business."},
    {title:"Mein USP",slug:"usp",description:"Was meinen Ansatz und meine Arbeit auszeichnet."},
    {title:"Meine Projekte",slug:"projekte",description:"Ein Einblick in praktische Projekte und Experimente."},
    {title:"Kontakt",slug:"kontakt",description:"Möglichkeiten zum Austausch und zur Kontaktaufnahme."}
  ];
  const defaultProjects = [
    {title:"eGGad_Digital",slug:"eggad-digital",short_description:"Digitale Marke rund um KI, praktische Inhalte und Webentwicklung.",sort_order:1,status:"draft"},
    {title:"Growth-Bot & Automatisierung",slug:"growth-bot-automatisierung",short_description:"Automatisierte Abläufe mit Make, Slack und Google Sheets.",sort_order:2,status:"draft"},
    {title:"Dashboards & Data Storytelling",slug:"dashboards-data-storytelling",short_description:"Datenanalyse, Kennzahlen und Visualisierung mit Google Sheets und Looker Studio.",sort_order:3,status:"draft"},
    {title:"KI-Lernassistent",slug:"ki-lernassistent",short_description:"Experiment mit einem lokalen KI-Assistenten auf Basis von Ollama und Qwen.",sort_order:4,status:"draft"},
    {title:"Valdara",slug:"valdara",short_description:"Entwicklung einer eigenen Fantasy-Welt mit interaktiven Geschichten.",sort_order:5,status:"draft"}
  ];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = msg => { const el=$("#toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); };
  const setMessage = (id,msg) => { const el=$(id); if(el) el.textContent=msg; };
  const showView = id => { $$(".view").forEach(v=>v.classList.toggle("active",v.id===id)); window.scrollTo(0,0); };
  const publicUrl = path => supabase.storage.from(cfg.storageBucket).getPublicUrl(path).data.publicUrl;
  async function loadPublicData(){
    if(!supabase){state.drawers=defaultDrawers;state.projects=defaultProjects;return;}
    const [p,d,pr] = await Promise.all([
      supabase.from("portfolio_profile").select("*").eq("published",true).limit(1).maybeSingle(),
      supabase.from("portfolio_drawers").select("*").eq("visible",true).order("sort_order"),
      supabase.from("projects").select("*").eq("status","published").order("sort_order")
    ]);
    if(p.data) state.profile=p.data;
    state.drawers=d.data?.length?d.data:defaultDrawers;
    state.projects=pr.data || [];
    renderDrawerButtons();
    renderProfile();
  }
  function renderProfile(){
    if(!state.profile)return;
    const p=state.profile;
    if(p.name) $(".hero h1").innerHTML=esc(p.name).replace(" ", " <span>")+"</span>";
    if(p.headline) $(".hero-lead").textContent=p.headline;
    if(p.introduction) $(".hero-intro").textContent=p.introduction;
    if(p.usp) $(".usp-strip p").textContent=p.usp;
    if(p.profile_image){$(".portrait").src=publicUrl(p.profile_image);}
    if(p.contact_text) $("#contact-copy").textContent=p.contact_text;
    if(p.contact_email){const a=$("#contact-email");a.hidden=false;a.href="mailto:"+p.contact_email;a.textContent=p.contact_email;}
  }
  function renderDrawerButtons(){
    const list=$("#drawer-list"); if(!list)return;
    const current=[...list.children];
    const bySlug=new Map(current.map(el=>[el.dataset.drawer,el]));
    list.innerHTML="";
    state.drawers.forEach((d,i)=>{
      if(d.visible===false)return;
      let b=bySlug.get(d.slug);
      if(!b){b=document.createElement("button");b.className="drawer";b.dataset.drawer=d.slug;b.innerHTML=`<span class="drawer-index"></span><span class="drawer-name"></span><span class="drawer-handle"></span><span class="drawer-arrow">↗</span>`;}
      $(".drawer-index",b).textContent=String(i+1).padStart(2,"0");
      $(".drawer-name",b).textContent=d.title;
      list.appendChild(b);
    });
  }
  function drawerMarkup(d){
    const descriptions={
      "ueber-mich":"Ich interessiere mich für digitales Marketing und den praktischen Einsatz künstlicher Intelligenz. Aktuell absolviere ich eine Weiterbildung im Bereich Digital Business. Mein Ziel ist es, moderne Technologien verständlich zu erklären und praktische Lösungen zu entwickeln.",
      "faehigkeiten":"Ich arbeite mich praxisnah in digitale Werkzeuge ein und verbinde Marketing, Daten und Automatisierung.",
      "weiterbildung":"Weiterbildungspaket Digital Business bei der DCI. Schwerpunkte: IT-Anwendungsberatung und KI Digital Marketing Management. Zeitraum: 17.08.2026 bis 12.10.2027.",
      "usp":"Ich erkläre KI-Tools und Marketing-Automatisierung verständlich und praxisnah, damit Menschen sie für ihre eigenen Aufgaben einsetzen können.",
      "kontakt":"Du möchtest dich austauschen oder hast Fragen zu einem Projekt? Ich freue mich über eine Nachricht."
    };
    if(d.slug==="projekte") return `<div class="eyebrow">Projektarchiv</div><h1>Meine <span>Projekte.</span></h1><p class="page-lead">Hier findest du praktische Projekte, Lernexperimente und eigene Entwicklungen.</p><div class="project-grid">${(state.projects.length?state.projects:defaultProjects).map((p,i)=>`<article class="project-card" data-project="${esc(p.slug)}"><div class="project-number">PROJECT / ${String(i+1).padStart(2,"0")}</div>${p.cover_image?`<img class="project-cover" src="${publicUrl(p.cover_image)}" alt="">`:''}<h3>${esc(p.title)}</h3><p>${esc(p.short_description)}</p><div class="text-link">Projekt öffnen ↗</div></article>`).join("")}</div>`;
    const body=d.content?.body || descriptions[d.slug] || d.description || "";
    return `<div class="eyebrow">Portfolio / ${esc(d.title)}</div><h1>${esc(d.title)}<span>.</span></h1><p class="page-lead">${esc(d.description||"")}</p><div class="content-card"><p>${esc(body).replace(/\n/g,"<br>")}</p></div>`;
  }
  async function openDrawer(slug){
    let d=state.drawers.find(x=>x.slug===slug)||defaultDrawers.find(x=>x.slug===slug);
    if(!d){location.hash="#portfolio";return;}
    if(supabase){const r=await supabase.from("portfolio_drawers").select("*").eq("slug",slug).maybeSingle();if(r.data)d=r.data;}
    $("#drawer-content").innerHTML=drawerMarkup(d);showView("drawer-page");
  }
  async function openProject(slug){
    let p=state.projects.find(x=>x.slug===slug);
    if(supabase){const r=await supabase.from("projects").select("*").eq("slug",slug).eq("status","published").maybeSingle();if(r.data)p=r.data;}
    if(!p){$("#project-content").innerHTML="<h1>Projekt noch nicht <span>veröffentlicht.</span></h1><p class='page-lead'>Dieses Projekt ist aktuell nicht öffentlich verfügbar.</p>";showView("project-page");return;}
    let blocks=[];
    if(supabase){const r=await supabase.from("project_blocks").select("*").eq("project_id",p.id).eq("visible",true).order("sort_order");blocks=r.data||[];}
    $("#project-content").innerHTML=`<div class="eyebrow">Projekt / Portfolio</div><h1>${esc(p.title)}<span>.</span></h1><p class="page-lead">${esc(p.short_description||"")}</p>${p.cover_image?`<img class="project-cover" style="height:auto;max-height:420px" src="${publicUrl(p.cover_image)}" alt="">`:''}${blocks.map(renderBlock).join("")||'<div class="content-card"><p>Die ausführliche Projektbeschreibung wird noch ergänzt.</p></div>'}`;
    showView("project-page");
  }
  function renderBlock(b){
    const c=b.content||{}, title=b.title?`<h2>${esc(b.title)}</h2>`:"";
    if(b.block_type==="text")return `<div class="content-card">${title}<p>${esc(c.text||"").replace(/\n/g,"<br>")}</p></div>`;
    if(b.block_type==="image")return `<div class="content-card">${title}${c.url?`<img class="block-image" src="${esc(c.url)}" alt="${esc(c.alt||"")}">`:""}</div>`;
    if(b.block_type==="gallery")return `<div class="content-card">${title}<div class="block-gallery">${(c.urls||[]).map(u=>`<img src="${esc(u)}" alt="">`).join("")}</div></div>`;
    if(b.block_type==="video")return `<div class="content-card">${title}${c.url?`<a class="text-link" href="${esc(c.url)}" target="_blank" rel="noopener">Video ansehen ↗</a>`:""}</div>`;
    if(b.block_type==="link")return `<div class="content-card">${title}<a class="text-link" href="${esc(c.url||"#")}" target="_blank" rel="noopener">${esc(c.label||"Mehr erfahren")} ↗</a></div>`;
    if(b.block_type==="results")return `<div class="content-card">${title}<p>${esc(c.text||"")}</p></div>`;
    if(b.block_type==="timeline")return `<div class="content-card">${title}<div class="block-timeline">${(c.items||[]).map(x=>`<div class="timeline-item"><strong>${esc(x.date||"")}</strong><p>${esc(x.text||"")}</p></div>`).join("")}</div></div>`;
    return "";
  }
  async function route(){
    const hash=decodeURIComponent(location.hash.slice(1)||"portfolio");
    $$(".nav-link").forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+hash || (hash==="portfolio"&&a.getAttribute("href")==="#portfolio")));
    if(hash==="portfolio"||hash===""){showView("portfolio-page");return;}
    if(hash==="kontakt"){showView("contact-page");return;}
    if(hash==="admin"){showView("admin-page");await checkSession();return;}
    if(hash.startsWith("drawer/")){await openDrawer(hash.split("/")[1]);return;}
    if(hash.startsWith("projekt/")){await openProject(hash.split("/")[1]);return;}
    location.hash="#portfolio";
  }
  async function checkSession(){
    if(!supabase){$("#admin-login").hidden=false;$("#admin-panel").hidden=true;setMessage("#login-message","Supabase konnte nicht initialisiert werden. Bitte config.js prüfen.");return;}
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){$("#admin-login").hidden=false;$("#admin-panel").hidden=true;return;}
    const {data:admin}=await supabase.from("app_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();
    if(!admin){await supabase.auth.signOut();$("#admin-login").hidden=false;$("#admin-panel").hidden=true;setMessage("#login-message","Dieser Benutzer ist nicht als Portfolio-Admin freigeschaltet.");return;}
    $("#admin-login").hidden=true;$("#admin-panel").hidden=false;await loadAdmin();
  }
  async function loadAdmin(){
    const {data:p}=await supabase.from("portfolio_profile").select("*").limit(1).maybeSingle();
    state.profile=p||{};
    const f=$("#profile-form");Object.entries(state.profile).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v??"";});
    const {data:d}=await supabase.from("portfolio_drawers").select("*").order("sort_order");state.drawers=d||[];renderDrawerAdmin();
    const {data:pr}=await supabase.from("projects").select("*").order("sort_order");state.projects=pr||[];renderProjectAdmin();
  }
  function renderDrawerAdmin(){
    $("#drawer-editor").innerHTML=state.drawers.map((d,i)=>`<div class="editor-row"><div><strong>${esc(d.title)}</strong><small>${esc(d.slug)} · Reihenfolge ${d.sort_order}</small></div><div class="row-actions"><button data-drawer-action="up" data-id="${d.id}" ${i===0?"disabled":""}>↑</button><button data-drawer-action="down" data-id="${d.id}" ${i===state.drawers.length-1?"disabled":""}>↓</button><button data-drawer-action="edit" data-id="${d.id}">Text bearbeiten</button><button data-drawer-action="toggle" data-id="${d.id}">${d.visible?"Ausblenden":"Einblenden"}</button></div></div>`).join("");
  }
  function renderProjectAdmin(){
    $("#project-editor").innerHTML=state.projects.map(p=>`<div class="editor-row"><div><strong>${esc(p.title)}</strong><small>${esc(p.slug)} · ${esc(p.status)}</small></div><div class="row-actions"><button data-project-action="edit" data-id="${p.id}">Bearbeiten</button><button data-project-action="blocks" data-id="${p.id}">Inhalte</button><button data-project-action="delete" data-id="${p.id}">Löschen</button></div></div>`).join("");
  }
  async function uploadFile(file,folder){
    if(!file)return null;
    const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");
    const path=`${folder}/${Date.now()}-${safe}`;
    const {error}=await supabase.storage.from(cfg.storageBucket).upload(path,file,{upsert:false});
    if(error)throw error;
    return path;
  }
  $("#login-form").addEventListener("submit",async e=>{
    e.preventDefault();setMessage("#login-message","Anmeldung läuft …");
    const {error}=await supabase.auth.signInWithPassword({email:$("#login-email").value,password:$("#login-password").value});
    if(error){setMessage("#login-message",error.message);return;}await checkSession();
  });
  $("#logout-button").addEventListener("click",async()=>{await supabase.auth.signOut();location.hash="#portfolio";toast("Abgemeldet.");});
  $("#profile-form").addEventListener("submit",async e=>{
    e.preventDefault();const f=e.currentTarget;const payload=Object.fromEntries(new FormData(f).entries());
    try{const file=$("#profile-upload").files[0];if(file)payload.profile_image=await uploadFile(file,"profile");payload.published=true;
      const {data:existing}=await supabase.from("portfolio_profile").select("id").limit(1).maybeSingle();
      const result=existing?await supabase.from("portfolio_profile").update(payload).eq("id",existing.id):await supabase.from("portfolio_profile").insert(payload);
      if(result.error)throw result.error;setMessage("#profile-message","Profil gespeichert.");await loadPublicData();toast("Profil gespeichert.");
    }catch(err){setMessage("#profile-message",err.message);}
  });
  $("#drawer-editor").addEventListener("click",async e=>{
    const b=e.target.closest("button[data-drawer-action]");if(!b)return;
    const i=state.drawers.findIndex(d=>d.id===b.dataset.id);const d=state.drawers[i];if(!d)return;
    if(b.dataset.drawerAction==="edit"){const title=prompt("Name der Schublade:",d.title);if(title===null)return;const body=prompt("Inhalt der Schublade:",d.content?.body||d.description||"");if(body===null)return;const description=prompt("Kurze Beschreibung:",d.description||"");if(description===null)return;const {error}=await supabase.from("portfolio_drawers").update({title,description,content:{...(d.content||{}),body}}).eq("id",d.id);if(error){toast(error.message);return;}}
    if(b.dataset.drawerAction==="toggle"){const {error}=await supabase.from("portfolio_drawers").update({visible:!d.visible}).eq("id",d.id);if(error){toast(error.message);return;}}
    if(b.dataset.drawerAction==="up"||b.dataset.drawerAction==="down"){const j=i+(b.dataset.drawerAction==="up"?-1:1);if(!state.drawers[j])return;const a=state.drawers[i],z=state.drawers[j];const {error:e1}=await supabase.from("portfolio_drawers").update({sort_order:z.sort_order}).eq("id",a.id);const {error:e2}=await supabase.from("portfolio_drawers").update({sort_order:a.sort_order}).eq("id",z.id);if(e1||e2){toast((e1||e2).message);return;}}
    await loadAdmin();await loadPublicData();toast("Schubladen aktualisiert.");
  });
  function clearProjectForm(){const f=$("#project-form");f.reset();f.elements.id.value="";$("#project-edit-form-wrap").hidden=true;$("#blocks-area").hidden=true;state.activeProject=null;}
  function editProject(p){const f=$("#project-form");Object.entries(p||{}).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v??"";});$("#project-form-title").textContent=p?.id?"Projekt bearbeiten":"Neues Projekt";$("#project-edit-form-wrap").hidden=false;$("#blocks-area").hidden= !p?.id;state.activeProject=p||null;window.scrollTo({top:$("#project-edit-form-wrap").getBoundingClientRect().top+window.scrollY-100,behavior:"smooth"});}
  $("#new-project").addEventListener("click",()=>editProject({status:"draft",sort_order:state.projects.length+1}));
  $("#cancel-project").addEventListener("click",clearProjectForm);
  $("#project-editor").addEventListener("click",async e=>{
    const b=e.target.closest("button[data-project-action]");if(!b)return;const p=state.projects.find(x=>x.id===b.dataset.id);if(!p)return;
    if(b.dataset.projectAction==="edit")editProject(p);
    if(b.dataset.projectAction==="blocks"){state.activeProject=p;$("#project-edit-form-wrap").hidden=false;$("#blocks-area").hidden=false;$("#project-form-title").textContent="Inhalte: "+p.title;await loadBlocks(p.id);$("#blocks-area").scrollIntoView({behavior:"smooth"});}
    if(b.dataset.projectAction==="delete"&&confirm(`Projekt "${p.title}" wirklich löschen?`)){const {error}=await supabase.from("projects").delete().eq("id",p.id);if(error)toast(error.message);else{await loadAdmin();toast("Projekt gelöscht.");}}
  });
  $("#project-form").addEventListener("submit",async e=>{
    e.preventDefault();const f=e.currentTarget;const payload=Object.fromEntries(new FormData(f).entries());payload.sort_order=Number(payload.sort_order||0);if(payload.status==="published")payload.published_at=new Date().toISOString();
    try{const file=$("#project-cover-upload").files[0];if(file)payload.cover_image=await uploadFile(file,"projects");const id=payload.id;delete payload.id;const r=id?await supabase.from("projects").update(payload).eq("id",id):await supabase.from("projects").insert(payload);if(r.error)throw r.error;setMessage("#project-message","Projekt gespeichert.");await loadAdmin();await loadPublicData();toast("Projekt gespeichert.");}catch(err){setMessage("#project-message",err.message);}
  });
  async function loadBlocks(projectId){const {data,error}=await supabase.from("project_blocks").select("*").eq("project_id",projectId).order("sort_order");if(error){toast(error.message);return;}state.blocks=data||[];renderBlocks();}
  function renderBlocks(){
    $("#block-editor").innerHTML=state.blocks.map((b,i)=>`<div class="block-editor-card" data-block="${b.id}"><strong>${esc(b.title||b.block_type)} <small class="muted">(${esc(b.block_type)})</small></strong><textarea data-field="content">${esc(JSON.stringify(b.content||{},null,2))}</textarea><div class="row-actions"><button data-block-action="up" ${i===0?"disabled":""}>↑</button><button data-block-action="down" ${i===state.blocks.length-1?"disabled":""}>↓</button><button data-block-action="save">Speichern</button><button data-block-action="delete">Löschen</button></div></div>`).join("");
  }
  $("#add-block").addEventListener("click",async()=>{
    if(!state.activeProject?.id){toast("Bitte zuerst ein Projekt speichern.");return;}
    const type=$("#block-type").value;const {error}=await supabase.from("project_blocks").insert({project_id:state.activeProject.id,block_type:type,title:type,content:{text:"Neuen Inhalt hier eintragen."},sort_order:state.blocks.length});
    if(error){toast(error.message);return;}await loadBlocks(state.activeProject.id);toast("Block hinzugefügt.");
  });
  $("#block-editor").addEventListener("click",async e=>{
    const b=e.target.closest("button[data-block-action]");if(!b)return;const card=b.closest("[data-block]");const i=state.blocks.findIndex(x=>x.id===card.dataset.block);const block=state.blocks[i];if(!block)return;
    if(b.dataset.blockAction==="save"){let content;try{content=JSON.parse($('textarea[data-field="content"]',card).value);}catch{toast("Der Inhalt muss gültiges JSON sein.");return;}const {error}=await supabase.from("project_blocks").update({content}).eq("id",block.id);if(error)toast(error.message);else toast("Block gespeichert.");}
    if(b.dataset.blockAction==="delete"&&confirm("Diesen Inhaltsblock löschen?")){const {error}=await supabase.from("project_blocks").delete().eq("id",block.id);if(error)toast(error.message);else await loadBlocks(state.activeProject.id);}
    if(b.dataset.blockAction==="up"||b.dataset.blockAction==="down"){const j=i+(b.dataset.blockAction==="up"?-1:1);if(!state.blocks[j])return;const a=state.blocks[i],z=state.blocks[j];await supabase.from("project_blocks").update({sort_order:z.sort_order}).eq("id",a.id);await supabase.from("project_blocks").update({sort_order:a.sort_order}).eq("id",z.id);await loadBlocks(state.activeProject.id);}
  });
  $("#admin-panel").addEventListener("click",e=>{
    const tab=e.target.closest(".admin-tab");if(!tab)return;
    $$(".admin-tab").forEach(x=>x.classList.toggle("active",x===tab));$$(".admin-section").forEach(x=>x.classList.toggle("active",x.id==="tab-"+tab.dataset.tab));
  });
  document.addEventListener("click",e=>{
    const drawer=e.target.closest("[data-drawer]");if(drawer){location.hash="#drawer/"+drawer.dataset.drawer;return;}
    const project=e.target.closest("[data-project]");if(project){location.hash="#projekt/"+project.dataset.project;}
  });
  $("#year").textContent=new Date().getFullYear();
  window.addEventListener("hashchange",route);
  loadPublicData().finally(route);
})();