import translations from './zona-copy.js';
const lang=document.documentElement.lang,c=translations[lang]||translations.hr;
const header=document.querySelector('.header'),nav=document.querySelector('.nav'),menu=document.querySelector('.menu');
const updateHeader=()=>header?.classList.toggle('scrolled',scrollY>60);updateHeader();addEventListener('scroll',updateHeader,{passive:true});
const closeMenu=()=>{nav?.classList.remove('mobile-open');menu?.setAttribute('aria-expanded','false');};
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('mobile-open');menu.setAttribute('aria-expanded',String(open));});
document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
document.querySelectorAll('details.language').forEach(d=>document.addEventListener('click',e=>{if(!d.contains(e.target))d.open=false;}));
const syncModal=()=>document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));
const dialogs=document.querySelectorAll('.unit-dialog');
document.querySelectorAll('.open-unit').forEach(button=>button.addEventListener('click',()=>{
 const dialog=document.getElementById('dialog-'+button.dataset.unitId);if(!dialog)return;
 dialog.showModal();syncModal();loadAvailability(dialog.querySelector('.availability'));
}));
dialogs.forEach(dialog=>{dialog.addEventListener('close',syncModal);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());});
document.querySelectorAll('.choose-unit').forEach(button=>button.addEventListener('click',()=>{const select=document.querySelector('#unit-select');if(!select)return;select.value=button.dataset.value;select.dispatchEvent(new Event('change'));button.closest('dialog')?.close();document.querySelector('#contact').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});select.focus({preventScroll:true});}));
const lightbox=document.querySelector('.lightbox');let gallery=[],photoIndex=0;
function renderPhoto(){const image=lightbox.querySelector('img');image.src=gallery[photoIndex].src;image.alt=gallery[photoIndex].alt;lightbox.querySelector('.lb-count').textContent=`${photoIndex+1} / ${gallery.length}`;}
if(lightbox){
 document.addEventListener('click',event=>{const button=event.target.closest('[data-lightbox]');if(!button)return;const buttons=[...document.querySelectorAll('[data-lightbox]')].filter(b=>b.dataset.lightbox===button.dataset.lightbox);gallery=buttons.map(b=>({src:b.dataset.src,alt:b.querySelector('img')?.alt||''}));photoIndex=buttons.indexOf(button);renderPhoto();lightbox.showModal();syncModal();});
 lightbox.querySelector('.lb-close').addEventListener('click',()=>lightbox.close());
 lightbox.querySelector('.lb-prev').addEventListener('click',()=>{photoIndex=(photoIndex-1+gallery.length)%gallery.length;renderPhoto();});
 lightbox.querySelector('.lb-next').addEventListener('click',()=>{photoIndex=(photoIndex+1)%gallery.length;renderPhoto();});
 lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();photoIndex=(photoIndex+(e.key==='ArrowRight'?1:-1)+gallery.length)%gallery.length;renderPhoto();}});
 lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});lightbox.addEventListener('close',syncModal);
}
const todayISO=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zagreb',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const form=document.querySelector('#booking-form');
const floatingContact=document.querySelector('.float-wa'),contactSection=document.querySelector('#contact');
if(floatingContact&&contactSection&&'IntersectionObserver' in window){new IntersectionObserver(entries=>{floatingContact.hidden=entries[0].isIntersecting;},{threshold:0}).observe(contactSection);}
if(form){
 const arrival=form.elements.arrival,departure=form.elements.departure,guests=form.elements.guests,unit=form.elements.unit;
 const capacity={'Studio za 2 osobe':2,'Studio apartman 2+1':3,'Apartman 3+2':5,'Studio apartman 3+2':5,'Apartman 4+2':6,'Soba za 2 osobe':2};
 function dates(){arrival.min=todayISO();arrival.setCustomValidity(arrival.value&&arrival.value<arrival.min?c.past:'');departure.min=arrival.value?new Date(Date.parse(arrival.value+'T12:00:00Z')+86400000).toISOString().slice(0,10):arrival.min;departure.setCustomValidity(arrival.value&&departure.value&&departure.value<=arrival.value?c.dates:'');}
 [arrival,departure].forEach(input=>input.addEventListener('input',dates));dates();
 unit.addEventListener('change',()=>{guests.max=capacity[unit.value]||6;});
 form.addEventListener('submit',async event=>{
  event.preventDefault();dates();if(!form.reportValidity()||form.dataset.sending==='true')return;
  const button=form.querySelector('button[type="submit"]'),status=form.querySelector('.form-status'),originalLabel=button.textContent;
  form.dataset.sending='true';button.disabled=true;button.textContent=c.sending;form.setAttribute('aria-busy','true');status.textContent='';
  try{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);let response;
   try{response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString(),signal:controller.signal});}finally{clearTimeout(timeout);}
   if(!response.ok)throw new Error('Submission failed');
   // A future consent-aware analytics adapter can listen; no personal data is included.
   document.dispatchEvent(new CustomEvent('zona:enquiry-success',{detail:{form:'zona-enquiry',language:lang}}));
   location.assign(form.getAttribute('action'));
  }catch{status.textContent=c.error;status.focus();button.disabled=false;button.textContent=originalLabel;form.dataset.sending='false';form.removeAttribute('aria-busy');}
 });
}
const calendarCache=new Map();
// Refresh only calendars the visitor is actually viewing; no background guest data collection.
setInterval(()=>{if(document.visibilityState==='visible')document.querySelectorAll('dialog[open] .availability').forEach(loadAvailability);},300000);
async function loadAvailability(container){
 if(!container)return;const unit=container.dataset.unit;
 const cached=calendarCache.get(unit);if(cached&&Date.now()-cached.at<300000){renderCalendar(container,cached.data);return;}
 try{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);let response;try{response=await fetch('/.netlify/functions/availability?unit='+encodeURIComponent(unit),{signal:controller.signal});}finally{clearTimeout(timeout);}if(!response.ok)throw new Error();const data=await response.json();if(data.status!=='ok'||!Array.isArray(data.busy)||!data.checkedAt)throw new Error();calendarCache.set(unit,{at:Date.now(),data});renderCalendar(container,data);}catch{container.querySelector('.availability-status').textContent=container.dataset.unknown;container.querySelector('.availability-months').replaceChildren();}
}
function renderCalendar(container,data){
 const checked=new Date(data.checkedAt);if(!Number.isFinite(checked.getTime())||Date.now()-checked.getTime()>900000)return;
 container.querySelector('.availability-status').textContent=`${c.updated}: ${new Intl.DateTimeFormat(lang,{dateStyle:'short',timeStyle:'short'}).format(checked)}. ${c.calendarNote}`;
 const grid=container.querySelector('.availability-months');grid.replaceChildren();const today=todayISO();
 const offset=Number(container.dataset.monthOffset)||0;
 const navigation=document.createElement('div');navigation.className='calendar-navigation';
 for(const [delta,label] of [[-3,'←'],[3,'→']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=offset+delta<0||offset+delta>12;button.setAttribute('aria-label',new Intl.DateTimeFormat(lang,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(Number(today.slice(0,4)),Number(today.slice(5,7))-1+offset+delta,1,12))));button.addEventListener('click',()=>{container.dataset.monthOffset=String(offset+delta);loadAvailability(container);});navigation.append(button);}grid.append(navigation);
 const start=new Date(today+'T12:00:00Z');start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()+offset);
 const legend=document.createElement('p');legend.className='availability-legend';legend.textContent=`● ${c.booked} · ${c.onRequest}`;grid.append(legend);
 for(let m=0;m<3;m++){
  const month=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+m,1,12)),table=document.createElement('table'),caption=document.createElement('caption');caption.textContent=new Intl.DateTimeFormat(lang,{month:'long',year:'numeric',timeZone:'UTC'}).format(month);table.append(caption);
  const head=document.createElement('thead'),row=document.createElement('tr');for(let d=0;d<7;d++){const th=document.createElement('th');th.scope='col';th.textContent=new Intl.DateTimeFormat(lang,{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,0,5+d,12)));row.append(th);}head.append(row);table.append(head);
  const body=document.createElement('tbody'),offset=(month.getUTCDay()+6)%7,days=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();let tr;
  for(let i=0;i<Math.ceil((offset+days)/7)*7;i++){if(i%7===0){tr=document.createElement('tr');body.append(tr);}const td=document.createElement('td'),day=i-offset+1;if(day>0&&day<=days){const iso=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),day,12)).toISOString().slice(0,10),busy=data.busy.some(r=>iso>=r.start&&iso<r.end);td.textContent=String(day);td.className=iso<today?'past':busy?'booked':'on-request';td.title=`${iso} — ${busy?c.booked:c.onRequest}`;td.setAttribute('aria-label',td.title);}else td.className='past';tr.append(td);}table.append(body);grid.append(table);
 }
}
