const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function showHistory({post,api,onRestore}) {
  let dialog=document.getElementById('history-dialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='history-dialog';dialog.setAttribute('aria-label','Version history');document.body.append(dialog);}
  dialog.innerHTML='<h2>Version history</h2><p>Loading saved versions…</p><button data-close-history>Close</button>';
  dialog.querySelector('[data-close-history]').onclick=()=>dialog.close();
  dialog.showModal();
  try {
    const {revisions}=await api('posts/'+encodeURIComponent(post.id)+'/revisions');
    dialog.innerHTML='<h2>Version history</h2><p>Restore creates a new draft. It does not change the published page.</p><div class="history-list">'+revisions.map(r=>`<div class="history-row"><div><b>Version ${Number(r.version)}</b><small>${escape(r.action)} · ${escape(r.created_at)}</small></div><button data-restore="${Number(r.version)}">Restore as draft</button></div>`).join('')+'</div><p role="alert" id="history-error"></p><button data-close-history>Close</button>';
    dialog.querySelector('[data-close-history]').onclick=()=>dialog.close();
    dialog.querySelectorAll('[data-restore]').forEach(button=>button.onclick=async()=>{
      if(!confirm('Restore this version as a new draft? Your published page will stay unchanged.'))return;
      dialog.querySelectorAll('button').forEach(el=>el.disabled=true);
      try {
        const {post:snapshot}=await api('posts/'+encodeURIComponent(post.id)+'/revisions/'+button.dataset.restore);
        const {post:restored}=await api('posts',{method:'POST',body:JSON.stringify({...snapshot,id:post.id,version:post.version,action:'save'})});
        dialog.close();onRestore(restored);
      }catch(error){dialog.querySelector('#history-error').textContent=error.message;}
      finally{dialog.querySelectorAll('button').forEach(el=>el.disabled=false);}
    });
  } catch(error) {dialog.querySelector('p').textContent=error.message;}
}
