(() => {
 const cfg=window.MILA_SUPABASE_CONFIG, status=document.getElementById('ff-status'), authWrap=document.getElementById('ff-auth'), postForm=document.getElementById('ff-post-form');
 if(!cfg||!window.supabase){status.textContent='Die Anmeldung ist gerade nicht verfügbar.';return;}
 const db=window.supabase.createClient(cfg.url,cfg.anonKey);
 const $=id=>document.getElementById(id);
 async function showSession(){const {data:{session}}=await db.auth.getSession();authWrap.hidden=!!session;postForm.hidden=!session;if(session){const {data:{user}}=await db.auth.getUser();$('author').value=user.user_metadata?.display_name||user.email?.split('@')[0]||'';}}
 $('ff-auth-form').addEventListener('submit',async e=>{e.preventDefault();const mode=e.submitter?.dataset.mode,email=$('email').value.trim(),password=$('password').value,name=$('display-name').value.trim();status.textContent='Einen Moment …';
 let result;if(mode==='signup')result=await db.auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}});else result=await db.auth.signInWithPassword({email,password});
 if(result.error){status.textContent=result.error.message;return;} if(mode==='signup'&&!result.data.session){status.textContent='Bitte bestätige zuerst deine E-Mail-Adresse. Danach kannst du dich hier anmelden.';return;} status.textContent='Angemeldet.';await showSession();});
 postForm.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Wird veröffentlicht …';const {data:{user}}=await db.auth.getUser();if(!user){status.textContent='Bitte melde dich erneut an.';await showSession();return;}
 const payload={user_id:user.id,author_name:$('author').value.trim(),story_slug:$('story').value,title:$('title').value.trim(),excerpt:$('excerpt').value.trim(),body:$('body').value.trim(),is_published:true};
 const {data,error}=await db.from('fanfiction_posts').insert(payload).select('id').single();if(error){status.textContent='Veröffentlichung nicht möglich: '+error.message;return;}location.href='/fan-fiction/beitrag/?id='+encodeURIComponent(data.id);});
 $('logout').addEventListener('click',async()=>{await db.auth.signOut();status.textContent='Du bist abgemeldet.';await showSession();});
 db.auth.onAuthStateChange(()=>showSession());showSession();
})();