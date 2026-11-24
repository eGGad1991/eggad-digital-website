(() => {
 const cfg=window.MILA_SUPABASE_CONFIG, root=document.getElementById('ff-list');
 if(!cfg||!window.supabase){root.textContent='Die Fan-Fiction-Funktion ist gerade nicht verfügbar.';return;}
 const db=window.supabase.createClient(cfg.url,cfg.anonKey);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function load(){const {data,error}=await db.from('fanfiction_posts').select('id,title,excerpt,body,author_name,created_at,story_slug').eq('is_published',true).order('created_at',{ascending:false}).limit(60);
 if(error){root.innerHTML='<p class="ff-empty">Die Beiträge konnten nicht geladen werden. Bitte versuche es später erneut.</p>';return;}
 if(!data?.length){root.innerHTML='<p class="ff-empty">Noch ist es ganz still hier. Vielleicht schreibst du die erste Fan-Fiction?</p>';return;}
 root.innerHTML=data.map(p=>'<article class="ff-card"><span class="ff-meta">'+esc(p.story_slug==='dark-romance'?'Dark Romance':'Mila-Story')+' · von '+esc(p.author_name||'Community')+'</span><h2>'+esc(p.title)+'</h2><p>'+esc(p.excerpt||String(p.body||'').slice(0,180))+'</p><a class="ff-btn" href="/fan-fiction/beitrag/?id='+encodeURIComponent(p.id)+'">Geschichte lesen</a></article>').join('');
 }
 load();
})();