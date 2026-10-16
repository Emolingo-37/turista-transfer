(()=>{'use strict';
const KEY='turista_live_demo_v1',EVENT='turista-demo-sync',RATE=.12;
const id=()=>Math.random().toString(36).slice(2,10).toUpperCase();
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
const write=a=>{localStorage.setItem(KEY,JSON.stringify(a.slice(0,35)));dispatchEvent(new Event(EVENT))};
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('tr-TR')+' ₺';
let timer=null,notifications=false,seenOffers=new Set();
const oldSearch=window.search;
window.search=function(){
 if(typeof T==='undefined'||!T.from||!T.to){if(typeof oldSearch==='function')oldSearch();return}
 const ref=id(),j={id:ref,from:T.from,to:T.to,when:T.date,pax:T.n,luggage:lug,category:T.n<=8?'Vito / Caravelle':T.n<=16?'Sprinter':'Midibüs',status:'new',created:Date.now(),offers:[]};
 write([j,...read()]);step(2);
 const c=add('<h4 id="offer-title">Firmalardan araç aranıyor</h4><p id="offer-info" style="color:#64748b;font-size:13px;line-height:1.5">Talebiniz alındı. Firmalardan fiyat teklifi bekleniyor.</p><div class="tg"><div>🔔 <b>Araç bulununca bana bildirim gönder</b><br><small style="color:#64748b">Sayfa açıkken güncellemeleri al</small></div><div class="sw" id="offer-notify" role="switch" aria-checked="false" tabindex="0"></div></div><div id="offer-list" style="margin-top:12px"></div><p style="font-size:11px;color:#64748b;margin-top:12px">Önizleme ortamı: Gerçek ödeme, SMS veya doğrulanmış eşleşme yapılmaz.</p><button class="btn alt" id="offer-cancel">Talebi iptal et</button>','card');
 const toggle=async()=>{notifications=!notifications;const b=c.querySelector('#offer-notify');b.classList.toggle('on',notifications);b.setAttribute('aria-checked',String(notifications));if(notifications&&'Notification'in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}};
 c.querySelector('#offer-notify').onclick=toggle;
 c.querySelector('#offer-notify').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};
 c.querySelector('#offer-cancel').onclick=()=>{const a=read(),item=a.find(x=>x.id===ref);if(item&&item.status==='new'){item.status='cancelled';write(a);refresh()}};
 const announce=(message)=>{if(!notifications)return;if('Notification'in window&&Notification.permission==='granted'&&!document.hasFocus()){try{new Notification('Turista Transfer',{body:message})}catch(e){}}};
 function refresh(){
  const item=read().find(x=>x.id===ref);if(!item||!c.isConnected){clearInterval(timer);return}
  const title=c.querySelector('#offer-title'),info=c.querySelector('#offer-info'),list=c.querySelector('#offer-list'),cancel=c.querySelector('#offer-cancel');
  const accepted=item.status==='confirmed'||item.status==='driver_assigned'||item.status==='completed';
  const done=item.status==='completed';
  if(item.status==='cancelled'){title.textContent='Talep iptal edildi';info.textContent='Yeni bir transfer talebi oluşturabilirsiniz.';list.replaceChildren();cancel.remove();clearInterval(timer);return}
  if(accepted){step(3);title.textContent=done?'Transfer tamamlandı':item.status==='driver_assigned'?'Şoför bilgileri hazır':'Teklifiniz onaylandı';info.textContent=done?'Yolculuğunuz tamamlandı.':item.status==='driver_assigned'?'Firma şoför bilgilerini paylaştı.':'Firma onayınızı aldı. Şoför bilgileri bekleniyor.';cancel.remove()}
  else {title.textContent=item.offers?.length?'Araç teklifleri bulundu':'Firmalardan araç aranıyor';info.textContent=item.offers?.length?'Firmalardan gelen teklifleri inceleyin.':'Talebiniz firmalara iletildi. Uygun araç aranıyor.'}
  const offers=accepted?(item.selected?[item.selected]:[]):(item.offers||[]);
  list.innerHTML=offers.map((v,i)=>{const net=Number(v.price),commission=Math.round(net*RATE),total=net+commission;
   return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:15px;padding:13px;margin:9px 0"><b>'+safe(v.company)+'</b><div style="font-size:13px;color:#64748b;margin:6px 0">'+safe(v.vehicle)+'</div><div class="row"><span>Transfer ücreti</span><b>'+money(net)+'</b></div><div class="row"><span>Turista hizmet bedeli (%12)</span><b>'+money(commission)+'</b></div><div class="row"><span>Toplam</span><b>'+money(total)+'</b></div>'+(accepted?'<div style="padding-top:12px;color:#15803d;font-size:13px;font-weight:700">✓ Teklif kabul edildi</div>':'<button class="btn" data-offer="'+i+'">Teklifi kabul et</button>')+'</div>'
  }).join('')+(item.driver&&accepted?'<div class="shield">Şoför: '+safe(item.driver.name)+' · Plaka: '+safe(item.driver.plate)+'</div>':'');
  list.querySelectorAll('[data-offer]').forEach(b=>b.onclick=()=>{const a=read(),t=a.find(x=>x.id===ref);if(!t||t.status!=='new')return;const v=t.offers[Number(b.dataset.offer)];if(!v)return;t.selected=v;t.status='confirmed';t.confirmedAt=Date.now();write(a);refresh()});
  (item.offers||[]).forEach(v=>{const oid=ref+'-'+v.created+'-'+v.price;if(!seenOffers.has(oid)){seenOffers.add(oid);announce('Transferiniz için yeni bir fiyat teklifi geldi.')}});
  if(accepted&&item.status==='driver_assigned')announce('Şoför bilgileri hazır.');
 }
 refresh();clearInterval(timer);timer=setInterval(refresh,1000);window.addEventListener('storage',refresh);window.addEventListener(EVENT,refresh);
};
})();