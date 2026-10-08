(async()=>{
 const container=document.querySelector('#origins-map');if(!container)return;
 const list=document.querySelector('#place-list'), detail=document.querySelector('#place-detail'),count=document.querySelector('#place-count'),search=document.querySelector('#place-search'),country=document.querySelector('#place-country');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 try{
 const response=await fetch('/assets/origins/locations.json');if(!response.ok)throw Error('data');const places=await response.json();
 const map=typeof L!=='undefined'?L.map(container,{zoomControl:false,scrollWheelZoom:false}).setView([49.4,10.2],5):null;
 if(map){L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(map);L.control.zoom({position:'bottomright'}).addTo(map);}
 else container.innerHTML='<p class="place-empty">The interactive map could not load. You can still browse all locations using the list.</p>';
 const markers=new Map();let selected=null,filtered=places;
 const icon=(p,active=false)=>L.divIcon({className:'origin-marker',html:`<div class="origin-pin ${active?'active':''}"><i>${p.id}</i></div>`,iconSize:[27,27],iconAnchor:[13,27]});
 function select(p,zoom=true){
  selected=p.id;for(const [id,m]of markers){m.setIcon(icon(places.find(x=>x.id===id),id===selected));m.setZIndexOffset(id===selected?1000:0)}
  list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.id)===p.id)));
  if(map&&zoom)map.setView([p.lat,p.lng],Math.max(map.getZoom(),12),{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});
  detail.innerHTML=`${p.images.length?`<img src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy">`:''}<div><p class="eyebrow">Location ${String(p.id).padStart(2,'0')} · ${esc(p.country)}</p><h2>${esc(p.name)}</h2><p>${esc(p.description||'A filming location included in the Anabaptist Origins field map.')}</p><div class="origin-actions"><a class="origin-link" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}" target="_blank" rel="noopener">Open directions ↗</a><a class="origin-link" href="/origins/episodes/">Watch the series ↗</a></div></div>`;
  const image=detail.querySelector('img');if(image)image.addEventListener('error',()=>{image.remove();detail.style.gridTemplateColumns='1fr'},{once:true});else detail.style.gridTemplateColumns='1fr';if(image)detail.style.gridTemplateColumns='';
  history.replaceState(null,'',`#location-${p.id}`);
 }
 function render(fit=true){
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const q=normalize(search.value.trim());
  filtered=places.filter(p=>(!country.value||p.country===country.value)&&normalize(p.name+' '+p.country+' '+p.description).includes(q));
  count.textContent=`${filtered.length} ${filtered.length===1?'location':'locations'} to explore`;
  list.innerHTML=filtered.length?filtered.map(p=>`<button type="button" class="place-item" data-id="${p.id}" aria-pressed="${selected===p.id}"><span class="place-num">${String(p.id).padStart(2,'0')}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.country)}</small></span></button>`).join(''):'<p class="place-empty">No locations match. Try another name or choose a different country.</p>';
  for(const m of markers.values())m.remove();markers.clear();
  if(map){for(const p of filtered){const m=L.marker([p.lat,p.lng],{icon:icon(p,p.id===selected),title:p.name,alt:p.name}).addTo(map).bindTooltip(esc(p.name),{direction:'top',offset:[0,-24]}).bindPopup(`<strong>${esc(p.name)}</strong><p>${esc(p.country)}</p><a href="#place-detail">Read the location story ↓</a>`).on('click',()=>{select(p,false);list.querySelector(`[data-id="${p.id}"]`)?.scrollIntoView({block:'nearest',behavior:'smooth'})});m.getElement()?.setAttribute('aria-label',p.name);markers.set(p.id,m)}if(fit&&filtered.length)map.fitBounds(filtered.map(p=>[p.lat,p.lng]),{padding:[55,75],maxZoom:12,animate:false});}
  if(selected&&!filtered.some(p=>p.id===selected)){selected=null;detail.innerHTML='<p>Choose a location to discover its story.</p>';history.replaceState(null,'',location.pathname)}
 }
 list.addEventListener('click',ev=>{const b=ev.target.closest('[data-id]');if(b)select(places.find(p=>p.id===Number(b.dataset.id)))});
 search.addEventListener('input',()=>render());country.addEventListener('change',()=>render());document.querySelector('#map-reset').addEventListener('click',()=>{search.value='';country.value='';selected=null;render();detail.innerHTML='<p>Choose a location to discover its story.</p>';history.replaceState(null,'',location.pathname)});
 render();const initial=places.find(p=>`#location-${p.id}`===location.hash);if(initial)select(initial);else select(places.find(p=>p.name==='Grossmünster Church'),false);
 }catch(error){list.innerHTML='<p class="place-empty">Locations could not load. Please refresh or use the original filming map linked below.</p>';count.textContent='Map unavailable';}
})();
