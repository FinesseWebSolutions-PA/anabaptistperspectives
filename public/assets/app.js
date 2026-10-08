const menu=document.querySelector('.menu');
const navigation=document.querySelector('#navigation');
function setMenu(open){menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');navigation.classList.toggle('open',open)}
menu?.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus()}});
document.addEventListener('click',event=>{if(menu?.getAttribute('aria-expanded')==='true'&&!menu.contains(event.target)&&!navigation.contains(event.target))setMenu(false)});
navigation?.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false)});
window.matchMedia('(min-width:701px)').addEventListener('change',event=>{if(event.matches&&menu)setMenu(false)});
const archive=document.querySelector('[data-archive]');
if(archive){const form=archive.querySelector('form'),input=archive.querySelector('#search'),topic=archive.querySelector('#topic'),results=archive.querySelector('#archive-results'),status=archive.querySelector('.results'),pages=archive.querySelector('.pagination');let data;const original={html:results.innerHTML,pages:pages.innerHTML,status:status.textContent};const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let request=0;
async function search(page=1){const id=++request,q=input.value.trim().toLowerCase(),t=topic.value;if(!q&&!t){results.innerHTML=original.html;pages.innerHTML=original.pages;status.textContent=original.status;history.replaceState(null,'',location.pathname);return}status.textContent='Searching the library…';try{data??=await fetch('/assets/search.json').then(r=>{if(!r.ok)throw Error();return r.json()});if(id!==request)return;const filtered=data.filter(r=>(archive.dataset.archive==='all'||r.kind===archive.dataset.archive)&&(!archive.dataset.scope||r.terms.includes(archive.dataset.scope))&&(!t||r.terms.includes(t))&&(!q||[r.title,r.excerpt,r.byline,r.number,...r.terms].join(' ').toLowerCase().includes(q)));const count=Math.ceil(filtered.length/24);status.textContent=`${filtered.length} matching resources${count?' · Page '+page+' of '+count:''}`;results.innerHTML=filtered.slice((page-1)*24,page*24).map(r=>`<article class="card"><a href="${esc(r.path)}">${r.image?`<img src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy" width="768" height="432">`:''}<div class="meta"><span class="red">${r.kind} ${esc(r.number)}${r.premium?' · Partner':''}</span><time>${r.date}</time></div><h3>${esc(r.title)}</h3></a><p>${esc(r.byline||r.excerpt.slice(0,145))}</p></article>`).join('')||'<p class="empty">No resources match your search. Try another word or choose all topics.</p>';pages.innerHTML='';for(let i=1;i<=count;i++){const b=document.createElement('button');b.type='button';b.textContent=i;b.className=page===i?'active':'';b.setAttribute('aria-label','Results page '+i);b.onclick=()=>{search(i);form.scrollIntoView({behavior:'smooth'})};pages.append(b)}const params=new URLSearchParams();if(q)params.set('q',input.value.trim());if(t)params.set('topic',t);history.replaceState(null,'',location.pathname+'?'+params)}catch(e){status.textContent='Search is unavailable right now. Please try again, or browse the archive below.'}}
form.addEventListener('submit',e=>{e.preventDefault();search()});topic.addEventListener('change',()=>search());input.addEventListener('input',()=>{if(!input.value)search()});const params=new URLSearchParams(location.search);if(params.has('q')||params.has('topic')){input.value=params.get('q')||'';topic.value=params.get('topic')||'';search()}}

document.querySelector('.featured-play')?.addEventListener('click',event=>{
 const button=event.currentTarget,media=button.closest('.featured-media');
 const frame=document.createElement('iframe');
 frame.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(button.dataset.video)+'?autoplay=1&rel=0';
 frame.title=button.getAttribute('aria-label').replace('Play video: ','');
 frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
 frame.allowFullscreen=true;frame.className='featured-player';
 media.replaceChildren(frame);frame.focus();
});
